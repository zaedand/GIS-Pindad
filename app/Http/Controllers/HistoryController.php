<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\DeviceHistory;
use App\Models\Node; // Sesuaikan dengan model Node Anda
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;

class HistoryController extends Controller
{
    /**
     * Get all history records
     * GET /api/history/all
     */
    public function getAllHistory(Request $request): JsonResponse
    {
        try {
            $query = DeviceHistory::query()
                ->orderBy('timestamp', 'desc')
                ->orderBy('created_at', 'desc');

            // Add pagination if needed
            if ($request->has('limit')) {
                $query->limit($request->get('limit', 100));
            }

            $history = $query->get();

            // Handle export request
            if ($request->get('export') === 'csv') {
                return $this->exportToCsv($history);
            }

            // Return as array for JavaScript compatibility
            return response()->json($history->toArray());

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch history',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get history for specific endpoint
     * GET /api/history/endpoint/{endpoint}
     */
    public function getHistory($endpoint, Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 50);

            $history = DeviceHistory::where('endpoint', $endpoint)
                ->orderBy('timestamp', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            return response()->json($history->toArray());

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch endpoint history',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for specific endpoint
     * GET /api/history/endpoint/{endpoint}/stats
     */
    public function getStats($endpoint): JsonResponse
    {
        try {
            $stats = [
                'total_events' => DeviceHistory::where('endpoint', $endpoint)->count(),
                'offline_events' => DeviceHistory::where('endpoint', $endpoint)
                    ->where('current_status', 'offline')->count(),
                'online_events' => DeviceHistory::where('endpoint', $endpoint)
                    ->where('current_status', 'online')->count(),
            ];

            // Calculate average offline duration if you have duration field
            $avgDuration = DeviceHistory::where('endpoint', $endpoint)
                ->where('current_status', 'offline')
                ->whereNotNull('duration')
                ->avg('duration');

            $stats['avg_offline_duration'] = $avgDuration ?
                $this->formatDuration($avgDuration) : 'N/A';

            return response()->json($stats);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch endpoint statistics',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get currently offline devices
     * GET /api/history/offline
     */
    public function getCurrentOffline(): JsonResponse
    {
        try {
            // Get latest status for each endpoint
            $latestStatuses = DeviceHistory::selectRaw('endpoint, current_status, MAX(timestamp) as latest_timestamp')
                ->groupBy('endpoint', 'current_status')
                ->havingRaw('current_status = "offline"')
                ->orderBy('latest_timestamp', 'desc')
                ->get();

            return response()->json($latestStatuses->toArray());

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch offline devices',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update device status
     * POST /api/history/update-status
     */
    public function updateStatus(Request $request): JsonResponse
    {
        try {
            // Validation rules
            $validator = Validator::make($request->all(), [
                'endpoint' => 'required|string|max:255',
                'node_name' => 'required|string|max:255',
                'previous_status' => 'required|string|in:online,offline,partial',
                'current_status' => 'required|string|in:online,offline,partial',
                'timestamp' => 'required|date',
                'description' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            // Check for duplicate entries (prevent double logging)
            $existing = DeviceHistory::where('endpoint', $data['endpoint'])
                ->where('timestamp', $data['timestamp'])
                ->where('current_status', $data['current_status'])
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'Status change already recorded',
                    'data' => $existing
                ], 200);
            }

            // Create new history record
            $history = DeviceHistory::create([
                'endpoint' => $data['endpoint'],
                'node_name' => $data['node_name'],
                'previous_status' => $data['previous_status'],
                'current_status' => $data['current_status'],
                'timestamp' => Carbon::parse($data['timestamp']),
                'description' => $data['description'] ?? $this->generateDescription($data['previous_status'], $data['current_status']),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'message' => 'Status updated successfully',
                'data' => $history
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export history to CSV
     */
    private function exportToCsv($history)
    {
        $filename = 'activity_logs_' . date('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($history) {
            $file = fopen('php://output', 'w');

            // CSV Headers
            fputcsv($file, [
                'ID', 'Endpoint', 'Node Name', 'Previous Status',
                'Current Status', 'Timestamp', 'Description', 'Created At'
            ]);

            // CSV Data
            foreach ($history as $record) {
                fputcsv($file, [
                    $record->id,
                    $record->endpoint,
                    $record->node_name,
                    $record->previous_status,
                    $record->current_status,
                    $record->timestamp,
                    $record->description,
                    $record->created_at
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Generate description based on status change
     */
    private function generateDescription($from, $to): string
    {
        if ($to === 'offline') {
            return 'Telepon tidak merespons';
        } elseif ($from === 'offline' && $to === 'online') {
            return 'Telepon kembali online';
        } elseif ($to === 'online') {
            return 'Telepon aktif';
        } else {
            return "Status berubah dari {$from} ke {$to}";
        }
    }

    /**
     * Generate PDF Report
     * GET /api/history/export-pdf
     */
     public function exportPdf(Request $request)
    {
        try {
            // Validate request parameters
            $validator = Validator::make($request->all(), [
                'date_method' => 'string|in:preset,custom',
                'start_date' => 'nullable|date|required_if:date_method,custom',
                'end_date' => 'nullable|date|required_if:date_method,custom|after_or_equal:start_date',
                'period' => 'nullable|integer|min:1|max:365',
                'quarter' => 'string|in:I,II,III,IV',
                'year' => 'integer|min:2020|max:2030',
                'report_type' => 'string|in:summary,detailed,kpi',
                'include_charts' => 'string|in:true,false',
                'include_ranking' => 'string|in:true,false',
                'include_history' => 'string|in:true,false',
                'include_recommendations' => 'string|in:true,false',
                'timeframe' => 'string|in:days,from_start,quarter'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Invalid parameters',
                    'messages' => $validator->errors()
                ], 400);
            }

            // Get and process parameters
            $dateMethod = $request->get('date_method', 'preset');
            $reportType = $request->get('report_type', 'summary');
            $quarter = $request->get('quarter', 'IV');
            $year = $request->get('year', date('Y'));

            // Determine date range based on method
            if ($dateMethod === 'custom') {
                $startDate = Carbon::parse($request->get('start_date'));
                $endDate = Carbon::parse($request->get('end_date'))->endOfDay();
                $period = $startDate->diffInDays($endDate) + 1;
            } else {
                $period = (int) $request->get('period', 30);
                $timeframe = $request->get('timeframe', 'days');

                // Calculate dates based on timeframe
                switch ($timeframe) {
                    case 'from_start':
                        $startDate = Carbon::create($year, 1, 1)->startOfDay();
                        $endDate = Carbon::now()->endOfDay();
                        break;
                    case 'quarter':
                        [$startDate, $endDate] = $this->getQuarterDateRange($quarter, $year);
                        break;
                    case 'days':
                    default:
                        $endDate = Carbon::now()->endOfDay();
                        $startDate = Carbon::now()->subDays($period - 1)->startOfDay();
                        break;
                }
            }

            // Validate date range
            $daysDiff = round($startDate->diffInDays($endDate) + 1);
            if ($daysDiff > 365) {
                return response()->json([
                    'error' => 'Date range too large',
                    'message' => 'Maximum date range is 365 days'
                ], 400);
            }

            // Get report options
            $includeCharts = $request->get('include_charts', 'true') === 'true';
            $includeRanking = $request->get('include_ranking', 'true') === 'true';
            $includeHistory = $request->get('include_history', 'false') === 'true';
            $includeRecommendations = $request->get('include_recommendations', 'false') === 'true';

            // Get all nodes data
            $nodes = Node::all();
            $totalNodes = $nodes->count();

            // Calculate current status statistics
            $onlineNodes = $nodes->where('status', 'online')->count();
            $offlineNodes = $nodes->where('status', 'offline')->count();
            $partialNodes = $nodes->where('status', 'partial')->count();
            $onlinePercentage = $totalNodes > 0 ? round(($onlineNodes / $totalNodes) * 100, 1) : 0;
            $offlinePercentage = $totalNodes > 0 ? round(($offlineNodes / $totalNodes) * 100, 1) : 0;

            // Get period-specific data
            $periodStats = $this->getPeriodStatistics($startDate, $endDate);
            $frequentlyOfflineEndpoints = $this->getFrequentlyOfflineEndpoints($startDate, $endDate, 10);
            $endpointsData = $this->generateEndpointsData($nodes, $startDate, $endDate);
            $rankingData = $includeRanking ? $this->generateRankingData($nodes, $startDate, $endDate) : [];
            $historyData = $includeHistory ? $this->generateHistoryData($startDate, $endDate) : [];
            $recommendations = $includeRecommendations ? $this->generateRecommendations($endpointsData, $periodStats) : [];

            // Calculate average uptime for the period
            $avgUptime = $this->calculateAverageUptime($nodes, $startDate, $endDate);

            // Prepare report data
            $reportData = [
                // KPI Information
                'indikator' => 'KPI-TI-001',
                'nama_indikator' => 'Availability Sistem Telepon Internal',
                'formula' => '(Total Waktu Online / Total Waktu Monitoring) × 100%',
                'target' => '≥ 95%',
                'realisasi' => $avgUptime . '%',
                'status_kpi' => $avgUptime >= 95 ? 'TERCAPAI' : 'TIDAK TERCAPAI',

                // Report metadata
                'report_type' => $reportType,
                'date_method' => $dateMethod,
                'quarter' => $quarter,
                'year' => $year,
                'period_days' => $daysDiff,
                'generated_date' => Carbon::now()->format('d/m/Y H:i:s'),
                'start_date' => $startDate->format('d/m/Y'),
                'end_date' => $endDate->format('d/m/Y'),
                'start_date_long' => $startDate->locale('id')->translatedFormat('l, j F Y'),
                'end_date_long' => $endDate->locale('id')->translatedFormat('l, j F Y'),

                // Current statistics
                'total_phones' => $totalNodes,
                'online_phones' => $onlineNodes,
                'offline_phones' => $offlineNodes,
                'partial_phones' => $partialNodes,
                'online_percentage' => $onlinePercentage,
                'offline_percentage' => $offlinePercentage,
                'avg_uptime' => $avgUptime,

                // Period statistics
                'period_stats' => $periodStats,
                'frequently_offline' => $frequentlyOfflineEndpoints,

                // Data tables
                'endpoints_data' => $endpointsData,
                'ranking_data' => $rankingData,
                'history_data' => $historyData,
                'recommendations' => $recommendations,

                // Report options
                'include_charts' => $includeCharts,
                'include_ranking' => $includeRanking,
                'include_history' => $includeHistory,
                'include_recommendations' => $includeRecommendations,

                // Report signature
                'prepared_by' => 'Sistem Monitoring Telepon',
                'position' => 'Admin IT',
                'department' => 'Departemen Teknologi Informasi'
            ];

            // Select appropriate view based on report type
            $viewName = match($reportType) {
                'detailed' => 'reports.phone-status-detailed-pdf',
                'kpi' => 'reports.phone-status-kpi-pdf',
                default => 'reports.phone-status-pdf'
            };

            // Generate PDF
            $pdf = Pdf::loadView($viewName, $reportData);

            // Configure PDF settings based on report type
            $orientation = $reportType === 'detailed' ? 'landscape' : 'portrait';
            $pdf->setPaper('A4', $orientation);
            $pdf->setOptions([
                'dpi' => 150,
                'defaultFont' => 'DejaVu Sans',
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'chroot' => public_path(),
            ]);

            // Generate filename
            $filename = $this->generatePdfFilename($reportData);

            return $pdf->download($filename);

        } catch (\Exception $e) {
            \Log::error('PDF Export Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'error' => 'Failed to generate PDF report',
                'message' => $e->getMessage(),
                'code' => $e->getCode()
            ], 500);
        }
    }

    /**
     * Get quarter date range
     */
    private function getQuarterDateRange($quarter, $year): array
    {
        $year = (int) $year;

        switch ($quarter) {
            case 'I':
                return [
                    Carbon::create($year, 1, 1)->startOfDay(),
                    Carbon::create($year, 3, 31)->endOfDay()
                ];
            case 'II':
                return [
                    Carbon::create($year, 4, 1)->startOfDay(),
                    Carbon::create($year, 6, 30)->endOfDay()
                ];
            case 'III':
                return [
                    Carbon::create($year, 7, 1)->startOfDay(),
                    Carbon::create($year, 9, 30)->endOfDay()
                ];
            case 'IV':
            default:
                return [
                    Carbon::create($year, 10, 1)->startOfDay(),
                    Carbon::create($year, 12, 31)->endOfDay()
                ];
        }
    }

    /**
     * Get period statistics
     */
    private function getPeriodStatistics($startDate, $endDate): array
    {
        $totalEvents = DeviceHistory::whereBetween('timestamp', [$startDate, $endDate])->count();
        $offlineEvents = DeviceHistory::whereBetween('timestamp', [$startDate, $endDate])
            ->where('current_status', 'offline')->count();
        $onlineEvents = DeviceHistory::whereBetween('timestamp', [$startDate, $endDate])
            ->where('current_status', 'online')->count();

        // Get most active day
        $mostActiveDay = DeviceHistory::whereBetween('timestamp', [$startDate, $endDate])
            ->selectRaw('DATE(timestamp) as date, COUNT(*) as events')
            ->groupBy('date')
            ->orderBy('events', 'desc')
            ->first();

        // Get most problematic endpoints in this period
        $problematicEndpoints = DeviceHistory::whereBetween('timestamp', [$startDate, $endDate])
            ->where('current_status', 'offline')
            ->selectRaw('endpoint, COUNT(*) as offline_count')
            ->groupBy('endpoint')
            ->orderBy('offline_count', 'desc')
            ->limit(5)
            ->get();

        return [
            'total_events' => $totalEvents,
            'offline_events' => $offlineEvents,
            'online_events' => $onlineEvents,
            'most_active_day' => $mostActiveDay ? [
                'date' => Carbon::parse($mostActiveDay->date)->format('d/m/Y'),
                'events' => $mostActiveDay->events
            ] : null,
            'problematic_endpoints' => $problematicEndpoints->map(function($item) {
                return [
                    'endpoint' => $item->endpoint,
                    'offline_count' => $item->offline_count
                ];
            })->toArray()
        ];
    }

    /**
     * Get frequently offline endpoints for specific period
     */
    private function getFrequentlyOfflineEndpoints($startDate, $endDate, int $limit = 5): string
    {
        $frequentOffline = DeviceHistory::select('endpoint')
            ->whereBetween('timestamp', [$startDate, $endDate])
            ->where('current_status', 'offline')
            ->groupBy('endpoint')
            ->orderByRaw('COUNT(*) DESC')
            ->limit($limit)
            ->pluck('endpoint')
            ->toArray();

        return empty($frequentOffline) ? 'Tidak ada data untuk periode ini' :
            'Endpoint ' . implode(', Endpoint ', $frequentOffline);
    }

    /**
     * Generate enhanced endpoints data
     */
    private function generateEndpointsData($nodes, $startDate, $endDate): array
    {
        $endpointsData = [];

        foreach ($nodes as $node) {
            $uptimeData = $this->calculateRealUptime($node->endpoint, $startDate, $endDate);
            $statistics = $this->getEndpointStatistics($node->endpoint, $startDate, $endDate);
            $totalOffline = $this->getTotalOfflineDuration($node->endpoint, $startDate, $endDate);

            $endpointsData[] = [
                'endpoint' => $node->endpoint,
                'building' => $node->name ?? 'Unknown',
                'ip_address' => $node->ip_address,
                'current_status' => $this->formatStatus($node->status ?? 'offline'),
                'uptime_period' => $uptimeData['uptimePercentage'] . '%',
                'total_offline_duration' => $totalOffline['formatted'],
                'total_events' => $statistics['total_events'],
                'offline_events' => $statistics['offline_events'],
                'online_events' => $statistics['online_events'],
                'reliability_score' => $this->calculateReliabilityScore($uptimeData['uptimePercentage'], $statistics['offline_events'])
            ];
        }

        // Sort by reliability score (lowest first to show problematic ones first)
        usort($endpointsData, function($a, $b) {
            return $a['reliability_score'] - $b['reliability_score'];
        });

        return $endpointsData;
    }

    /**
     * Calculate reliability score (0-100, higher is better)
     */
    private function calculateReliabilityScore($uptimePercentage, $offlineEvents): int
    {
        $uptimeScore = $uptimePercentage * 0.7; // 70% weight for uptime
        $stabilityScore = max(0, 100 - ($offlineEvents * 5)) * 0.3; // 30% weight for stability

        return (int) round($uptimeScore + $stabilityScore);
    }

    /**
     * Generate history data for detailed reports
     */
    private function generateHistoryData($startDate, $endDate): array
    {
        return DeviceHistory::whereBetween('timestamp', [$startDate, $endDate])
            ->orderBy('timestamp', 'desc')
            ->limit(100) // Limit for PDF size
            ->get()
            ->map(function($item) {
                return [
                    'timestamp' => Carbon::parse($item->timestamp)->format('d/m/Y H:i:s'),
                    'endpoint' => $item->endpoint,
                    'node_name' => $item->node_name,
                    'previous_status' => $item->previous_status,
                    'current_status' => $item->current_status,
                    'description' => $item->description
                ];
            })
            ->toArray();
    }

    /**
     * Generate recommendations based on data analysis
     */
    private function generateRecommendations($endpointsData, $periodStats): array
    {
        $recommendations = [];

        // Check for frequently offline endpoints
        $problematicEndpoints = array_filter($endpointsData, function($endpoint) {
            return $endpoint['offline_events'] > 5 || $endpoint['reliability_score'] < 70;
        });

        if (count($problematicEndpoints) > 0) {
            $recommendations[] = [
                'category' => 'Maintenance',
                'priority' => 'High',
                'title' => 'Pemeliharaan Endpoint Bermasalah',
                'description' => 'Terdapat ' . count($problematicEndpoints) . ' endpoint yang sering offline. Perlu dilakukan pengecekan hardware dan koneksi jaringan.',
                'endpoints' => array_column($problematicEndpoints, 'endpoint')
            ];
        }

        // Check overall uptime
        $avgUptime = array_sum(array_column($endpointsData, 'uptime_period')) / count($endpointsData);
        if ($avgUptime < 95) {
            $recommendations[] = [
                'category' => 'Infrastructure',
                'priority' => 'Medium',
                'title' => 'Peningkatan Infrastruktur Jaringan',
                'description' => 'Rata-rata uptime sistem hanya ' . number_format($avgUptime, 1) . '%. Disarankan untuk menganalisis infrastruktur jaringan dan melakukan upgrade jika diperlukan.'
            ];
        }

        // Check for monitoring frequency
        if ($periodStats['total_events'] < (count($endpointsData) * 24)) { // Less than 1 event per endpoint per day
            $recommendations[] = [
                'category' => 'Monitoring',
                'priority' => 'Low',
                'title' => 'Peningkatan Frekuensi Monitoring',
                'description' => 'Frekuensi monitoring dapat ditingkatkan untuk deteksi masalah yang lebih cepat.'
            ];
        }

        return $recommendations;
    }

    /**
     * Calculate average uptime for all nodes in period
     */
    private function calculateAverageUptime($nodes, $startDate, $endDate): float
    {
        $totalUptime = 0;
        $nodeCount = 0;

        foreach ($nodes as $node) {
            $uptimeData = $this->calculateRealUptime($node->endpoint, $startDate, $endDate);
            if ($uptimeData['dataAvailable']) {
                $totalUptime += $uptimeData['uptimePercentage'];
                $nodeCount++;
            }
        }

        return $nodeCount > 0 ? round($totalUptime / $nodeCount, 1) : 0;
    }

    /**
     * Enhanced uptime calculation with custom date range
     */
    private function calculateRealUptime($endpoint, $startDate, $endDate)
    {
        $endpointLogs = DeviceHistory::where('endpoint', $endpoint)
            ->whereBetween('timestamp', [$startDate, $endDate])
            ->orderBy('timestamp', 'asc')
            ->get();

        $totalMinutes = $startDate->diffInMinutes($endDate);

        if ($endpointLogs->isEmpty()) {
            return [
                'uptimePercentage' => 0,
                'totalMinutes' => $totalMinutes,
                'onlineMinutes' => 0,
                'offlineMinutes' => 0,
                'dataAvailable' => false
            ];
        }

        $offlineMinutes = 0;
        $currentOfflineStart = null;

        // Calculate offline duration
        foreach ($endpointLogs as $log) {
            $logTime = Carbon::parse($log->timestamp);

            if ($log->current_status === 'offline' && !$currentOfflineStart) {
                $currentOfflineStart = $logTime;
            } elseif ($log->current_status === 'online' && $currentOfflineStart) {
                $offlineMinutes += $currentOfflineStart->diffInMinutes($logTime);
                $currentOfflineStart = null;
            }
        }

        // If still offline at end of period
        if ($currentOfflineStart) {
            $offlineMinutes += $currentOfflineStart->diffInMinutes($endDate);
        }

        $onlineMinutes = max(0, $totalMinutes - $offlineMinutes);
        $uptimePercentage = $totalMinutes > 0 ? round(($onlineMinutes / $totalMinutes) * 100, 1) : 0;

        return [
            'uptimePercentage' => $uptimePercentage,
            'totalMinutes' => $totalMinutes,
            'onlineMinutes' => $onlineMinutes,
            'offlineMinutes' => $offlineMinutes,
            'dataAvailable' => true
        ];
    }

    /**
     * Get endpoint statistics for custom period
     */
    private function getEndpointStatistics($endpoint, $startDate, $endDate): array
    {
        return [
            'total_events' => DeviceHistory::where('endpoint', $endpoint)
                ->whereBetween('timestamp', [$startDate, $endDate])->count(),
            'offline_events' => DeviceHistory::where('endpoint', $endpoint)
                ->where('current_status', 'offline')
                ->whereBetween('timestamp', [$startDate, $endDate])->count(),
            'online_events' => DeviceHistory::where('endpoint', $endpoint)
                ->where('current_status', 'online')
                ->whereBetween('timestamp', [$startDate, $endDate])->count(),
        ];
    }

    /**
     * Get total offline duration for custom period
     */
    private function getTotalOfflineDuration($endpoint, $startDate, $endDate): array
    {
        $logs = DeviceHistory::where('endpoint', $endpoint)
            ->where('current_status', 'offline')
            ->whereBetween('timestamp', [$startDate, $endDate])
            ->orderBy('timestamp', 'asc')
            ->get();

        $totalMinutes = 0;
        $currentOfflineStart = null;

        foreach ($logs as $log) {
            $logTime = Carbon::parse($log->timestamp);

            if ($log->current_status === 'offline' && !$currentOfflineStart) {
                $currentOfflineStart = $logTime;
            } elseif ($log->current_status === 'online' && $currentOfflineStart) {
                $totalMinutes += $currentOfflineStart->diffInMinutes($logTime);
                $currentOfflineStart = null;
            }
        }

        // If still offline
        if ($currentOfflineStart) {
            $totalMinutes += $currentOfflineStart->diffInMinutes($endDate);
        }

        return [
            'minutes' => $totalMinutes,
            'formatted' => $this->formatDuration($totalMinutes)
        ];
    }

    /**
     * Generate PDF filename based on report data
     */
    private function generatePdfFilename($reportData): string
    {
        $type = ucfirst($reportData['report_type']);

        if ($reportData['date_method'] === 'custom') {
            $start = str_replace('/', '-', $reportData['start_date']);
            $end = str_replace('/', '-', $reportData['end_date']);
            return "Laporan_{$type}_Status_Telepon_{$start}_to_{$end}.pdf";
        } else {
            $quarter = $reportData['quarter'];
            $year = $reportData['year'];
            $period = $reportData['period_days'];
            return "Laporan_{$type}_Status_Telepon_Q{$quarter}_{$year}_{$period}hari.pdf";
        }
    }

    // ... existing methods (formatStatus, formatDuration, etc.) ...

    /**
     * Format status for display
     */
    private function formatStatus($status): string
    {
        switch (strtolower($status)) {
            case 'online': return 'Online';
            case 'offline': return 'Offline';
            case 'partial': return 'In Use';
            default: return 'Unknown';
        }
    }

    /**
     * Format duration in minutes to readable format
     */
    private function formatDuration($minutes): string
    {
        if ($minutes < 1) return 'Kurang dari 1 menit';
        if ($minutes < 60) return $minutes . ' menit';

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;

        if ($hours < 24) {
            return $remainingMinutes > 0 ?
                "{$hours}j {$remainingMinutes}m" :
                "{$hours} jam";
        }

        $days = floor($hours / 24);
        $remainingHours = $hours % 24;

        return $remainingHours > 0 ?
            "{$days}h {$remainingHours}j" :
            "{$days} hari";
    }


    /**
     * Generate endpoints data for table
     */


    /**
     * Generate ranking data for frequently offline endpoints
     */
    /**
 * Generate ranking data for frequently offline endpoints
 */
private function generateRankingData($nodes, $startDate, $endDate)
{
    $rankingData = [];

    foreach ($nodes as $node) {
        $uptimeData = $this->calculateRealUptime($node->endpoint, $startDate, $endDate);
        $statistics = $this->getEndpointStatistics($node->endpoint, $startDate, $endDate);
        $totalOfflineDuration = $this->getTotalOfflineDuration($node->endpoint, $startDate, $endDate);

        // Only include endpoints that have had offline events
        if ($statistics['offline_events'] > 0) {
            $rankingData[] = [
                'endpoint' => $node->endpoint,
                'building' => $node->name ?? 'Unknown',
                'uptime_period' => $uptimeData['uptimePercentage'] . '%',
                'total_offline_duration' => $totalOfflineDuration['formatted'],
                'total_events' => $statistics['total_events'],
                'offline_events' => $statistics['offline_events'],
                'online_events' => $statistics['online_events'],
                'last_activity' => $this->getLastActivity($node->endpoint),
                'offline_score' => $statistics['offline_events'] // For sorting
            ];
        }
    }

    // Sort by offline events (descending - most problematic first)
    usort($rankingData, function($a, $b) {
        return $b['offline_score'] - $a['offline_score'];
    });

    // Add ranking numbers
    foreach ($rankingData as $index => &$data) {
        $data['rank'] = $index + 1;
    }

    return array_slice($rankingData, 0, 20); // Top 20 most problematic
}

    /**
     * Calculate real uptime for endpoint
     */

    /**
     * Get endpoint statistics
     */


    /**
     * Get total offline duration for endpoint
     */

    /**
     * Get last activity for endpoint
     */
    private function getLastActivity($endpoint)
    {
        $lastActivity = DeviceHistory::where('endpoint', $endpoint)
            ->orderBy('timestamp', 'desc')
            ->first();

        return $lastActivity ?
            Carbon::parse($lastActivity->timestamp)->format('d/m/Y H:i:s') : 'N/A';
    }

    /**
     * Format status for display
     */


    /**
     * Format duration in minutes to readable format
     */


    // ... existing methods ...
}

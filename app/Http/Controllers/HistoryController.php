<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\DeviceHistory;
use App\Models\Node;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;

class HistoryController extends Controller
{
    public function exportPdf(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date_method' => 'string|in:preset,custom',
                'start_date' => 'nullable|date|required_if:date_method,custom',
                'end_date' => 'nullable|date|required_if:date_method,custom|after_or_equal:start_date',
                'period' => 'nullable|integer|min:1|max:365',
                'quarter' => 'string|in:I,II,III,IV',
                'year' => 'integer|min:2020|max:2030',
                'timeframe' => 'string|in:days,from_start,quarter',
                // KPI Information validation
                'indikator' => 'nullable|string|max:255',
                'nama_indikator' => 'nullable|string|max:500',
                'formula' => 'nullable|string|max:500',
                'target' => 'nullable|string|max:255',
                'realisasi' => 'nullable|string|max:255',
                // Footer/Signature validation
                'prepared_jabatan' => 'nullable|string|max:255',
                'prepared_nama' => 'nullable|string|max:255',
                'prepared_tanggal' => 'nullable|date',
                'approved_jabatan' => 'nullable|string|max:255',
                'approved_nama' => 'nullable|string|max:255',
                'approved_tanggal' => 'nullable|date',
                'validated_jabatan' => 'nullable|string|max:255',
                'validated_nama' => 'nullable|string|max:255',
                'validated_tanggal' => 'nullable|date',
                'department' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Invalid parameters',
                    'messages' => $validator->errors()
                ], 400);
            }

            // --- Process dates ---
            $dateMethod = $request->get('date_method', 'preset');
            $quarter = $request->get('quarter', 'IV');
            $year = $request->get('year', date('Y'));
            $timeframe = $request->get('timeframe', 'days');

            if ($dateMethod === 'custom') {
                $startDate = Carbon::parse($request->get('start_date'));
                $endDate = Carbon::parse($request->get('end_date'))->endOfDay();
                $period = $startDate->diffInDays($endDate) + 1;
            } else {
                $period = (int) $request->get('period', 30);
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

            $daysDiff = round($startDate->diffInDays($endDate) + 1);
            if ($daysDiff > 365) {
                return response()->json([
                    'error' => 'Date range too large',
                    'message' => 'Maximum date range is 365 days'
                ], 400);
            }

            // --- Get statistics from history ---
            $currentStats = $this->getLatestStatusStatisticsOptimized();
            $periodStats = $this->getPeriodStatistics($startDate, $endDate);

            // FIX: Convert collection to array and handle empty results
            $frequentlyOfflineEndpoints = $this->getFrequentlyOfflineEndpoints($startDate, $endDate, 10);

            $endpointsData = $this->generateEndpointsDataFromHistory($currentStats['latest_statuses'], $startDate, $endDate);
            $rankingData = $request->get('include_ranking', 'true') === 'true'
                ? $this->generateRankingDataFromHistory($currentStats['latest_statuses'], $startDate, $endDate)
                : [];

            $avgUptime = $this->calculateAverageUptimeFromHistory($currentStats['latest_statuses'], $startDate, $endDate);

            // --- FIX: Ensure all data is properly formatted for template ---
            $reportData = [
                // KPI Information
                'indikator' => (string) $request->get('indikator', ),
                'nama_indikator' => (string) $request->get('nama_indikator', ),
                'formula' => (string) $request->get('formula', ),
                'target' => (string) $request->get('target', ),
                'realisasi' => (string) $request->get('realisasi', ),

                // Department/Organization info
                'department' => (string) $request->get('department', 'DEPARTEMEN 0'),

                // Metadata
                'quarter' => (string) $quarter,
                'year' => (string) $year,
                'period_days' => (int) $daysDiff,
                'generated_date' => Carbon::now('Asia/Jakarta')->format('d/m/Y H:i:s'),
                'start_date' => $startDate->format('d/m/Y'),
                'end_date' => $endDate->format('d/m/Y'),

                // Statistics - ensure all are proper types
                'total_phones' => (int) $currentStats['total_nodes'],
                'online_phones' => (int) $currentStats['online_nodes'],
                'offline_phones' => (int) $currentStats['offline_nodes'],
                'partial_phones' => (int) $currentStats['partial_nodes'],
                'online_percentage' => (string) $currentStats['online_percentage'] . '%',
                'offline_percentage' => (string) $currentStats['offline_percentage'] . '%',
                'avg_uptime' => (float) $avgUptime,

                // Table data - ensure arrays
                'endpoints_data' => is_array($endpointsData) ? $endpointsData : [],
                'ranking_data' => is_array($rankingData) ? $rankingData : [],
                'period_stats' => is_array($periodStats) ? $periodStats : [],
                'frequently_offline' => is_array($frequentlyOfflineEndpoints) ? $frequentlyOfflineEndpoints : [],

                // Signature information - ensure strings
                'prepared_jabatan' => (string) $request->get('prepared_jabatan', 'OFFICER MANAJEMEN SISTEM KOMPUTER TUREN'),
                'prepared_nama' => (string) $request->get('prepared_nama', 'MUHAMMAD'),
                'prepared_tanggal' => $request->get('prepared_tanggal') ?
                    Carbon::parse($request->get('prepared_tanggal'))->locale('id')->translatedFormat('d F Y') :
                    Carbon::now()->locale('id')->translatedFormat('d F Y'),

                'approved_jabatan' => (string) $request->get('approved_jabatan', 'MANAGER'),
                'approved_nama' => (string) $request->get('approved_nama', ''),
                'approved_tanggal' => $request->get('approved_tanggal') ?
                    Carbon::parse($request->get('approved_tanggal'))->locale('id')->translatedFormat('d F Y') :
                    null,

                'validated_jabatan' => (string) $request->get('validated_jabatan', 'MANAGER LAYANAN TI BANDUNG TUREN'),
                'validated_nama' => (string) $request->get('validated_nama', 'RIZKY'),
                'validated_tanggal' => $request->get('validated_tanggal') ?
                    Carbon::parse($request->get('validated_tanggal'))->locale('id')->translatedFormat('d F Y') :
                    Carbon::now()->locale('id')->translatedFormat('d F Y'),

                // Additional info for template
                'report_title' => (string) $this->generateReportTitle($quarter, $year),
                'period_description' => (string) $this->generatePeriodDescription($startDate, $endDate, $timeframe),
            ];

            // Debug log to check data types before PDF generation
            \Log::info('PDF Report Data Types Check:', [
                'endpoints_data_type' => gettype($reportData['endpoints_data']),
                'endpoints_data_count' => is_array($reportData['endpoints_data']) ? count($reportData['endpoints_data']) : 'not_array',
                'ranking_data_type' => gettype($reportData['ranking_data']),
                'frequently_offline_type' => gettype($reportData['frequently_offline']),
                'period_stats_type' => gettype($reportData['period_stats']),
            ]);

            // Generate PDF
            $pdf = Pdf::loadView('reports.phone-status-pdf', $reportData)
                ->setPaper('A4', 'portrait')
                ->setOptions([
                    'dpi' => 150,
                    'defaultFont' => 'DejaVu Sans',
                    'isRemoteEnabled' => true,
                    'isHtml5ParserEnabled' => true,
                    'chroot' => public_path(),
                ]);

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
     * FIX: Get frequently offline endpoints - return array instead of string
     */
    private function getFrequentlyOfflineEndpoints($startDate, $endDate, int $limit = 5): array
    {
        $frequentOffline = DeviceHistory::select('endpoint')
            ->selectRaw('COUNT(*) as offline_count')
            ->whereBetween('timestamp', [$startDate, $endDate])
            ->where('current_status', 'offline')
            ->groupBy('endpoint')
            ->orderByRaw('COUNT(*) DESC')
            ->limit($limit)
            ->get();

        // Convert to array with proper structure
        return $frequentOffline->map(function($item) {
            return [
                'endpoint' => $item->endpoint,
                'offline_count' => $item->offline_count
            ];
        })->toArray();
    }

    /**
     * FIX: Enhanced endpoints data generation with type safety
     */
    private function generateEndpointsDataFromHistory($latestStatuses, $startDate, $endDate): array
    {
        $endpointsData = [];

        // Ensure $latestStatuses is iterable
        if (!is_iterable($latestStatuses)) {
            \Log::warning('Latest statuses is not iterable', ['type' => gettype($latestStatuses)]);
            return [];
        }

        foreach ($latestStatuses as $status) {
            try {
                $uptimeData = $this->calculateRealUptime($status->endpoint, $startDate, $endDate);
                $statistics = $this->getEndpointStatistics($status->endpoint, $startDate, $endDate);
                $totalOffline = $this->getTotalOfflineDuration($status->endpoint, $startDate, $endDate);

                // Try to get building name from nodes table
                $node = Node::where('endpoint', $status->endpoint)->first();
                $buildingName = $node ? $node->name : ($status->node_name ?? 'Unknown');
                $ipAddress = $node ? $node->ip_address : 'Unknown';

                $endpointsData[] = [
                    'endpoint' => (string) $status->endpoint,
                    'building' => (string) $buildingName,
                    'ip_address' => (string) $ipAddress,
                    'current_status' => (string) $this->formatStatus($status->current_status),
                    'last_update' => Carbon::parse($status->timestamp)->format('d/m/Y H:i:s'),
                    'uptime_period' => (string) $uptimeData['uptimePercentage'] . '%',
                    'total_offline_duration' => (string) $totalOffline['formatted'],
                    'total_events' => (int) $statistics['total_events'],
                    'offline_events' => (int) $statistics['offline_events'],
                    'online_events' => (int) $statistics['online_events'],
                    'reliability_score' => (int) $this->calculateReliabilityScore($uptimeData['uptimePercentage'], $statistics['offline_events'])
                ];
            } catch (\Exception $e) {
                \Log::error('Error processing endpoint: ' . $status->endpoint, [
                    'error' => $e->getMessage(),
                    'status' => $status
                ]);
                continue;
            }
        }

        // Sort by reliability score
        usort($endpointsData, function($a, $b) {
            return $a['reliability_score'] - $b['reliability_score'];
        });

        return $endpointsData;
    }

    /**
     * FIX: Enhanced ranking data generation with type safety
     */
    private function generateRankingDataFromHistory($latestStatuses, $startDate, $endDate): array
    {
        $rankingData = [];

        // Ensure $latestStatuses is iterable
        if (!is_iterable($latestStatuses)) {
            \Log::warning('Latest statuses is not iterable for ranking', ['type' => gettype($latestStatuses)]);
            return [];
        }

        foreach ($latestStatuses as $status) {
            try {
                $uptimeData = $this->calculateRealUptime($status->endpoint, $startDate, $endDate);
                $statistics = $this->getEndpointStatistics($status->endpoint, $startDate, $endDate);
                $totalOfflineDuration = $this->getTotalOfflineDuration($status->endpoint, $startDate, $endDate);

                // Only include endpoints that have had offline events
                if ($statistics['offline_events'] > 0) {
                    $node = Node::where('endpoint', $status->endpoint)->first();
                    $buildingName = $node ? $node->name : ($status->node_name ?? 'Unknown');

                    $rankingData[] = [
                        'endpoint' => (string) $status->endpoint,
                        'building' => (string) $buildingName,
                        'current_status' => (string) $this->formatStatus($status->current_status),
                        'uptime_period' => (string) $uptimeData['uptimePercentage'] . '%',
                        'total_offline_duration' => (string) $totalOfflineDuration['formatted'],
                        'total_events' => (int) $statistics['total_events'],
                        'offline_events' => (int) $statistics['offline_events'],
                        'online_events' => (int) $statistics['online_events'],
                        'last_activity' => Carbon::parse($status->timestamp)->format('d/m/Y H:i:s'),
                        'offline_score' => (int) $statistics['offline_events']
                    ];
                }
            } catch (\Exception $e) {
                \Log::error('Error processing ranking for endpoint: ' . $status->endpoint, [
                    'error' => $e->getMessage(),
                    'status' => $status
                ]);
                continue;
            }
        }

        // Sort by offline events (descending)
        usort($rankingData, function($a, $b) {
            return $b['offline_score'] - $a['offline_score'];
        });

        // Add ranking numbers and ensure proper data types
        $rankedData = [];
        foreach (array_slice($rankingData, 0, 20) as $index => $data) {
            $data['rank'] = (int) ($index + 1);
            $rankedData[] = $data;
        }

        return $rankedData;
    }

    /**
     * FIX: Enhanced period statistics with proper return types
     */
    private function getPeriodStatistics($startDate, $endDate): array
    {
        try {
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
                'total_events' => (int) $totalEvents,
                'offline_events' => (int) $offlineEvents,
                'online_events' => (int) $onlineEvents,
                'most_active_day' => $mostActiveDay ? [
                    'date' => Carbon::parse($mostActiveDay->date)->format('d/m/Y'),
                    'events' => (int) $mostActiveDay->events
                ] : null,
                'problematic_endpoints' => $problematicEndpoints->map(function($item) {
                    return [
                        'endpoint' => (string) $item->endpoint,
                        'offline_count' => (int) $item->offline_count
                    ];
                })->toArray()
            ];
        } catch (\Exception $e) {
            \Log::error('Error getting period statistics', ['error' => $e->getMessage()]);
            return [
                'total_events' => 0,
                'offline_events' => 0,
                'online_events' => 0,
                'most_active_day' => null,
                'problematic_endpoints' => []
            ];
        }
    }

    /**
     * FIX: Generate PDF filename with proper string handling
     */
    private function generatePdfFilename($reportData): string
    {
        $quarter = $reportData['quarter'] ?? 'IV';
        $year = $reportData['year'] ?? date('Y');
        $period = $reportData['period_days'] ?? 30;

        return "Laporan_Status_Telepon_Q{$quarter}_{$year}_{$period}hari.pdf";
    }

    /**
     * Generate report title based on type and period
     */
    private function generateReportTitle($quarter, $year): string
    {
        return "LAPORAN KPI INVENTARISASI SISTEM KOMPUTER TRIWULAN {$quarter} TAHUN {$year}";
    }

    /**
     * Generate period description for template
     */
    private function generatePeriodDescription($startDate, $endDate, $timeframe = 'days'): string
    {
        $start = $startDate->locale('id')->translatedFormat('d F Y');
        $end = $endDate->locale('id')->translatedFormat('d F Y');
        $days = $startDate->diffInDays($endDate) + 1;

        switch ($timeframe) {
            case 'from_start':
                return "Periode dari awal tahun sampai sekarang ({$start} - {$end}, {$days} hari)";
            case 'quarter':
                return "Periode triwulan ({$start} - {$end}, {$days} hari)";
            default:
                return "Periode {$days} hari terakhir ({$start} - {$end})";
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
     * Enhanced uptime calculation with custom date range
     */
    private function calculateRealUptime($endpoint, $startDate, $endDate): array
    {
        try {
            $endpointLogs = DeviceHistory::where('endpoint', $endpoint)
                ->whereBetween('timestamp', [$startDate, $endDate])
                ->orderBy('timestamp', 'asc')
                ->get();

            $totalMinutes = $startDate->diffInMinutes($endDate);

            if ($endpointLogs->isEmpty()) {
                return [
                    'uptimePercentage' => 0.0,
                    'totalMinutes' => (int) $totalMinutes,
                    'onlineMinutes' => 0,
                    'offlineMinutes' => 0,
                    'dataAvailable' => false
                ];
            }

            $offlineMinutes = 0;
            $currentOfflineStart = null;

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
            $uptimePercentage = $totalMinutes > 0 ? round(($onlineMinutes / $totalMinutes) * 100, 1) : 0.0;

            return [
                'uptimePercentage' => (float) $uptimePercentage,
                'totalMinutes' => (int) $totalMinutes,
                'onlineMinutes' => (int) $onlineMinutes,
                'offlineMinutes' => (int) $offlineMinutes,
                'dataAvailable' => true
            ];
        } catch (\Exception $e) {
            \Log::error('Error calculating uptime for endpoint: ' . $endpoint, ['error' => $e->getMessage()]);
            return [
                'uptimePercentage' => 0.0,
                'totalMinutes' => 0,
                'onlineMinutes' => 0,
                'offlineMinutes' => 0,
                'dataAvailable' => false
            ];
        }
    }

    /**
     * Get endpoint statistics for custom period
     */
    private function getEndpointStatistics($endpoint, $startDate, $endDate): array
    {
        try {
            return [
                'total_events' => (int) DeviceHistory::where('endpoint', $endpoint)
                    ->whereBetween('timestamp', [$startDate, $endDate])->count(),
                'offline_events' => (int) DeviceHistory::where('endpoint', $endpoint)
                    ->where('current_status', 'offline')
                    ->whereBetween('timestamp', [$startDate, $endDate])->count(),
                'online_events' => (int) DeviceHistory::where('endpoint', $endpoint)
                    ->where('current_status', 'online')
                    ->whereBetween('timestamp', [$startDate, $endDate])->count(),
            ];
        } catch (\Exception $e) {
            \Log::error('Error getting endpoint statistics', ['endpoint' => $endpoint, 'error' => $e->getMessage()]);
            return [
                'total_events' => 0,
                'offline_events' => 0,
                'online_events' => 0,
            ];
        }
    }

    /**
     * Get total offline duration for custom period
     */
    private function getTotalOfflineDuration($endpoint, $startDate, $endDate): array
    {
        try {
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
                'minutes' => (int) $totalMinutes,
                'formatted' => (string) $this->formatDuration($totalMinutes)
            ];
        } catch (\Exception $e) {
            \Log::error('Error getting offline duration', ['endpoint' => $endpoint, 'error' => $e->getMessage()]);
            return [
                'minutes' => 0,
                'formatted' => '0 menit'
            ];
        }
    }

    /**
     * Calculate average uptime for all nodes in period
     */
    private function calculateAverageUptimeFromHistory($latestStatuses, $startDate, $endDate): float
    {
        $totalUptime = 0;
        $nodeCount = 0;

        if (!is_iterable($latestStatuses)) {
            return 0.0;
        }

        foreach ($latestStatuses as $status) {
            $uptimeData = $this->calculateRealUptime($status->endpoint, $startDate, $endDate);
            if ($uptimeData['dataAvailable']) {
                $totalUptime += $uptimeData['uptimePercentage'];
                $nodeCount++;
            }
        }

        return $nodeCount > 0 ? round($totalUptime / $nodeCount, 1) : 0.0;
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
     * FIX: Alternative method using subquery for better performance with proper type handling
     */
    private function getLatestStatusStatisticsOptimized(): array
    {
        try {
            $latestStatuses = \DB::table('device_history as dh1')
                ->select('dh1.endpoint', 'dh1.current_status', 'dh1.timestamp', 'dh1.node_name')
                ->whereRaw('dh1.timestamp = (
                    SELECT MAX(dh2.timestamp)
                    FROM device_history dh2
                    WHERE dh2.endpoint = dh1.endpoint
                )')
                ->groupBy('dh1.endpoint', 'dh1.current_status', 'dh1.timestamp', 'dh1.node_name')
                ->get();

            $totalNodes = $latestStatuses->count();
            $onlineNodes = $latestStatuses->where('current_status', 'online')->count();
            $offlineNodes = $latestStatuses->where('current_status', 'offline')->count();
            $partialNodes = $latestStatuses->where('current_status', 'partial')->count();

            $onlinePercentage = $totalNodes > 0 ? round(($onlineNodes / $totalNodes) * 100, 1) : 0;
            $offlinePercentage = $totalNodes > 0 ? round(($offlineNodes / $totalNodes) * 100, 1) : 0;

            return [
                'total_nodes' => (int) $totalNodes,
                'online_nodes' => (int) $onlineNodes,
                'offline_nodes' => (int) $offlineNodes,
                'partial_nodes' => (int) $partialNodes,
                'online_percentage' => (float) $onlinePercentage,
                'offline_percentage' => (float) $offlinePercentage,
                'latest_statuses' => $latestStatuses
            ];
        } catch (\Exception $e) {
            \Log::error('Error getting latest status statistics', ['error' => $e->getMessage()]);
            return [
                'total_nodes' => 0,
                'online_nodes' => 0,
                'offline_nodes' => 0,
                'partial_nodes' => 0,
                'online_percentage' => 0.0,
                'offline_percentage' => 0.0,
                'latest_statuses' => collect([])
            ];
        }
    }

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

    // === EXISTING METHODS (UNCHANGED) ===

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
    public function getCurrentOfflineFromHistory(): JsonResponse
    {
        try {
            $currentStats = $this->getLatestStatusStatisticsOptimized();

            $offlineDevices = $currentStats['latest_statuses']
                ->where('current_status', 'offline')
                ->map(function($status) {
                    return [
                        'endpoint' => $status->endpoint,
                        'node_name' => $status->node_name,
                        'current_status' => $status->current_status,
                        'last_update' => Carbon::parse($status->timestamp)->format('d/m/Y H:i:s'),
                        'duration_offline' => Carbon::parse($status->timestamp)->diffForHumans(Carbon::now(), true)
                    ];
                })
                ->values()
                ->toArray();

            return response()->json([
                'total_offline' => count($offlineDevices),
                'offline_devices' => $offlineDevices
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch offline devices from history',
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
}

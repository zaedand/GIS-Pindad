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
            // Get report parameters
            $period = $request->get('period', '30'); // Default 30 days
            $quarter = $request->get('quarter', 'IV'); // Default Q4
            $year = $request->get('year', '2024'); // Default 2024
            
            // Calculate date ranges
            $endDate = Carbon::now();
            $startDate = Carbon::now()->subDays((int)$period);
            
            // Get all nodes data
            $nodes = Node::all();
            $totalNodes = $nodes->count();
            
            // Calculate current status statistics
            $onlineNodes = $nodes->where('status', 'online')->count();
            $offlineNodes = $nodes->where('status', 'offline')->count();
            $onlinePercentage = $totalNodes > 0 ? round(($onlineNodes / $totalNodes) * 100, 1) : 0;
            $offlinePercentage = $totalNodes > 0 ? round(($offlineNodes / $totalNodes) * 100, 1) : 0;
            
            // Get most frequently offline endpoints
            $frequentlyOfflineEndpoints = $this->getFrequentlyOfflineEndpoints(5);
            
            // Get all endpoints data with statistics
            $endpointsData = $this->generateEndpointsData($nodes, $period);
            
            // Get ranking data (endpoints ranked by offline frequency)
            $rankingData = $this->generateRankingData($nodes, $period);
            
            // Report metadata
            $reportData = [
                'indikator' => 'KPI-TI-001',
                'nama_indikator' => 'Availability Sistem Telepon Internal',
                'formula' => '(Total Waktu Online / Total Waktu Monitoring) × 100%',
                'target' => '≥ 95%',
                'realisasi' => $onlinePercentage . '%',
                
                // Report info
                'quarter' => $quarter,
                'year' => $year,
                'period_days' => $period,
                'generated_date' => Carbon::now()->format('d/m/Y H:i:s'),
                'start_date' => $startDate->format('d/m/Y'),
                'end_date' => $endDate->format('d/m/Y'),
                
                // Statistics
                'total_phones' => $totalNodes,
                'online_phones' => $onlineNodes,
                'offline_phones' => $offlineNodes,
                'online_percentage' => $onlinePercentage,
                'offline_percentage' => $offlinePercentage,
                'frequently_offline' => $frequentlyOfflineEndpoints,
                
                // Data tables
                'endpoints_data' => $endpointsData,
                'ranking_data' => $rankingData,
                
                // Report signature
                'prepared_by' => 'Admin Sistem',
                'position' => 'Teknisi IT',
                'department' => 'Departemen Service Representative TI Turen'
            ];
            
            // Generate PDF
            $pdf = Pdf::loadView('reports.phone-status-pdf', $reportData);
            
            // Configure PDF settings
            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'dpi' => 150,
                'defaultFont' => 'Arial',
                'isRemoteEnabled' => true,
            ]);
            
            $filename = "Laporan_Status_Telepon_Q{$quarter}_{$year}_" . date('Ymd_His') . ".pdf";
            
            return $pdf->download($filename);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate PDF report',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get frequently offline endpoints
     */
    private function getFrequentlyOfflineEndpoints(int $limit = 5): string
    {
        $frequentOffline = DeviceHistory::select('endpoint')
            ->where('current_status', 'offline')
            ->where('timestamp', '>=', Carbon::now()->subDays(30))
            ->groupBy('endpoint')
            ->orderByRaw('COUNT(*) DESC')
            ->limit($limit)
            ->pluck('endpoint')
            ->toArray();
            
        return empty($frequentOffline) ? 'Tidak ada data' : 'Endpoint ' . implode(', Endpoint ', $frequentOffline);
    }
    
    /**
     * Generate endpoints data for table
     */
    private function generateEndpointsData($nodes, $period)
    {
        $endpointsData = [];
        
        foreach ($nodes as $node) {
            $uptimeData = $this->calculateRealUptime($node->endpoint, $period * 24);
            $statistics = $this->getEndpointStatistics($node->endpoint, $period);
            
            $endpointsData[] = [
                'endpoint' => $node->endpoint,
                'building' => $node->name ?? 'Unknown',
                'ip_address' => $node->ip_address,
                'current_status' => $this->formatStatus($node->status ?? 'offline'),
                'uptime_30d' => $uptimeData['uptimePercentage'] . '%',
                'total_events' => $statistics['total_events'],
                'offline_events' => $statistics['offline_events'],
                'online_events' => $statistics['online_events'],
                'last_seen' => $node->last_ping_raw ? 
                    Carbon::parse($node->last_ping_raw)->format('d/m/Y H:i:s') : 'N/A'
            ];
        }
        
        // Sort by uptime (lowest first to show problematic ones first)
        usort($endpointsData, function($a, $b) {
            return (int)str_replace('%', '', $a['uptime_30d']) - (int)str_replace('%', '', $b['uptime_30d']);
        });
        
        return $endpointsData;
    }
    
    /**
     * Generate ranking data for frequently offline endpoints
     */
    private function generateRankingData($nodes, $period)
    {
        $rankingData = [];
        
        foreach ($nodes as $node) {
            $uptimeData = $this->calculateRealUptime($node->endpoint, $period * 24);
            $statistics = $this->getEndpointStatistics($node->endpoint, $period);
            $totalOfflineDuration = $this->getTotalOfflineDuration($node->endpoint);
            
            // Only include endpoints that have had offline events
            if ($statistics['offline_events'] > 0) {
                $rankingData[] = [
                    'endpoint' => $node->endpoint,
                    'building' => $node->name ?? 'Unknown',
                    'uptime_30d' => $uptimeData['uptimePercentage'] . '%',
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
    private function calculateRealUptime($endpoint, $timeRangeHours = 24)
    {
        $endpointLogs = DeviceHistory::where('endpoint', $endpoint)
            ->where('timestamp', '>=', Carbon::now()->subHours($timeRangeHours))
            ->orderBy('timestamp', 'asc')
            ->get();
            
        if ($endpointLogs->isEmpty()) {
            return [
                'uptimePercentage' => 0,
                'totalMinutes' => $timeRangeHours * 60,
                'onlineMinutes' => 0,
                'offlineMinutes' => 0,
                'dataAvailable' => false
            ];
        }
        
        $totalMinutes = $timeRangeHours * 60;
        $offlineMinutes = 0;
        
        // Calculate offline duration
        $currentOfflineStart = null;
        
        foreach ($endpointLogs as $log) {
            if ($log->current_status === 'offline' && !$currentOfflineStart) {
                $currentOfflineStart = Carbon::parse($log->timestamp);
            } elseif ($log->current_status === 'online' && $currentOfflineStart) {
                $offlineEnd = Carbon::parse($log->timestamp);
                $offlineMinutes += $currentOfflineStart->diffInMinutes($offlineEnd);
                $currentOfflineStart = null;
            }
        }
        
        // If still offline, count until now
        if ($currentOfflineStart) {
            $offlineMinutes += $currentOfflineStart->diffInMinutes(Carbon::now());
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
     * Get endpoint statistics
     */
    private function getEndpointStatistics($endpoint, $period)
    {
        $since = Carbon::now()->subDays($period);
        
        return [
            'total_events' => DeviceHistory::where('endpoint', $endpoint)
                ->where('timestamp', '>=', $since)->count(),
            'offline_events' => DeviceHistory::where('endpoint', $endpoint)
                ->where('current_status', 'offline')
                ->where('timestamp', '>=', $since)->count(),
            'online_events' => DeviceHistory::where('endpoint', $endpoint)
                ->where('current_status', 'online')
                ->where('timestamp', '>=', $since)->count(),
        ];
    }
    
    /**
     * Get total offline duration for endpoint
     */
    private function getTotalOfflineDuration($endpoint)
    {
        // This should implement the same logic as your JavaScript function
        $logs = DeviceHistory::where('endpoint', $endpoint)
            ->where('current_status', 'offline')
            ->where('timestamp', '>=', Carbon::now()->subDays(30))
            ->get();
            
        $totalMinutes = 0;
        // Add your duration calculation logic here
        
        return [
            'minutes' => $totalMinutes,
            'formatted' => $this->formatDuration($totalMinutes)
        ];
    }
    
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
    private function formatStatus($status)
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
    
    // ... existing methods ...
}

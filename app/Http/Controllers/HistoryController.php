<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\DeviceHistory;
use App\Models\Node;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class HistoryController extends Controller
{
    // Optimized constants for better performance
    private const CACHE_TTL = 300; // 5 minutes
    private const LONG_CACHE_TTL = 1800; // 30 minutes for static data
    private const SHORT_CACHE_TTL = 60; // 1 minute for real-time data
    private const MAX_DATE_RANGE_DAYS = 365;
    private const DEFAULT_PERIOD_DAYS = 30;
    private const DEFAULT_LIMIT = 50;
    private const RANKING_LIMIT = 20;
    private const FREQUENT_OFFLINE_LIMIT = 10;
    private const MAX_EXPORT_RECORDS = 50000; // Prevent memory issues

    private const STATUS_MAPPING = [
        'online' => 'Online',
        'offline' => 'Offline',
        'partial' => 'In Use'
    ];

    private const QUARTERS = [
        'I' => [1, 3],
        'II' => [4, 6],
        'III' => [7, 9],
        'IV' => [10, 12]
    ];

    private const VALIDATION_RULES = [
        'date_method' => 'string|in:preset,custom',
        'start_date' => 'nullable|date|required_if:date_method,custom',
        'end_date' => 'nullable|date|required_if:date_method,custom|after_or_equal:start_date',
        'period' => 'nullable|integer|min:1|max:365',
        'quarter' => 'string|in:I,II,III,IV',
        'year' => 'integer|min:2020|max:2030',
        'timeframe' => 'string|in:days,from_start,quarter',
        'format' => 'string|in:download,view'
    ];

    /**
     * Fixed PDF export with comprehensive error handling
     */
    public function exportPdf(Request $request)
    {
        $startTime = microtime(true);

        try {
            // Enhanced input validation with flexible date format
            $validation = $this->validatePdfRequestOptimized($request);
            if ($validation instanceof JsonResponse) {
                // Return the validation error as response, not JsonResponse for PDF method
                return response()->json($validation->getData(), $validation->getStatusCode());
            }

            Log::info('PDF Export Request Started', [
                'date_method' => $request->get('date_method'),
                'quarter' => $request->get('quarter'),
                'year' => $request->get('year'),
                'memory_start' => memory_get_usage(true)
            ]);

            // Process data with optimized pipeline
            [$kpiData, $chartData, $dateRange] = $this->processRequestDataOptimized($request);

            // Validate constraints
            if ($dateRange['days'] > self::MAX_DATE_RANGE_DAYS) {
                return response()->json([
                    'error' => 'Date range too large. Maximum: ' . self::MAX_DATE_RANGE_DAYS . ' days'
                ], 400);
            }

            // Generate report data with caching strategy
            $reportData = $this->generateReportDataOptimized($kpiData, $chartData, $dateRange);

            // Memory check before PDF generation
            $memoryUsage = memory_get_usage(true);
            if ($memoryUsage > (512 * 1024 * 1024)) { // 512MB threshold
                Log::warning('High memory usage detected', ['memory' => $memoryUsage]);
                gc_collect_cycles();
            }

            // Generate PDF with optimized settings
            $pdf = $this->generateOptimizedPdf($reportData);
            $filename = $this->generatePdfFilename($reportData);

            $executionTime = microtime(true) - $startTime;
            Log::info('PDF Export Completed', [
                'execution_time' => round($executionTime, 2),
                'memory_peak' => memory_get_peak_usage(true),
                'filename' => $filename
            ]);

            return $pdf->download($filename);

        } catch (\Exception $e) {
            $executionTime = microtime(true) - $startTime;

            Log::error('PDF Export Failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'execution_time' => round($executionTime, 2),
                'memory_peak' => memory_get_peak_usage(true),
                'request_data' => $request->only(['date_method', 'quarter', 'year', 'period'])
            ]);

            return response()->json([
                'error' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get chart data with advanced caching strategy
     */
    public function getChartData(Request $request): JsonResponse
    {
        try {
            $validated = $this->validateChartRequestOptimized($request);
            if ($validated instanceof JsonResponse) {
                return $validated;
            }

            $dateRange = $this->processDateRangeOptimized($request);

            // Multi-level cache key for better cache hit ratio
            $cacheKey = $this->generateCacheKey('chart_data', [
                'date_method' => $dateRange['date_method'] ?? 'preset',
                'start' => $dateRange['start_date']->format('Y-m-d'),
                'end' => $dateRange['end_date']->format('Y-m-d'),
                'timeframe' => $dateRange['timeframe'] ?? 'days'
            ]);

            $data = Cache::remember($cacheKey, self::CACHE_TTL, function() use ($dateRange) {
                return $this->calculateChartStatisticsOptimized($dateRange);
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'cache_key' => $cacheKey,
                'generated_at' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Chart data generation failed', [
                'error' => $e->getMessage(),
                'request' => $request->only(['date_method', 'period', 'quarter', 'year'])
            ]);

            return $this->errorResponse('Failed to generate chart data: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get real-time uptime data with smart caching
     */
    public function getRealTimeUptimeData(): JsonResponse
    {
        try {
            $cacheKey = 'realtime_uptime_' . date('Y-m-d-H-i');

            $data = Cache::remember($cacheKey, self::SHORT_CACHE_TTL, function() {
                return $this->calculateRealTimeStatsOptimized();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'timestamp' => now()->toISOString(),
                'cache_ttl' => self::SHORT_CACHE_TTL
            ]);

        } catch (\Exception $e) {
            Log::error('Real-time data generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->errorResponse('Failed to get real-time data: ' . $e->getMessage(), 500);
        }
    }

    // =============================================================================
    // OPTIMIZED PRIVATE METHODS
    // =============================================================================

    /**
     * Fixed PDF request validation with flexible date format handling
     */
    private function validatePdfRequestOptimized(Request $request)
    {
        $rules = array_merge(self::VALIDATION_RULES, [
            'report_type' => 'string|in:kpi,summary',
            'indikator' => 'nullable|string|max:255',
            'nama_indikator' => 'nullable|string|max:1000',
            'formula' => 'nullable|string|max:1000',
            'target' => 'nullable|string|max:255',
            'realisasi' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',

            // Flexible signature fields validation
            'prepared_jabatan' => 'nullable|string|max:255',
            'prepared_nama' => 'nullable|string|max:255',
            'prepared_tanggal' => 'nullable|string|max:20', // Allow flexible date formats
            'approved_jabatan' => 'nullable|string|max:255',
            'approved_nama' => 'nullable|string|max:255',
            'approved_tanggal' => 'nullable|string|max:20', // Allow flexible date formats
            'validated_jabatan' => 'nullable|string|max:255',
            'validated_nama' => 'nullable|string|max:255',
            'validated_tanggal' => 'nullable|string|max:20', // Allow flexible date formats

            // Chart data validation
            'chart_image' => 'nullable|string',
            'chart_data' => 'nullable|string',
            'include_chart' => 'nullable|string|in:true,false'
        ]);

        // Custom validation for flexible date handling
        $validator = Validator::make($request->all(), $rules);

        // Add custom date validation after basic validation
        $validator->after(function ($validator) use ($request) {
            $dateFields = ['prepared_tanggal', 'approved_tanggal', 'validated_tanggal'];

            foreach ($dateFields as $field) {
                $dateValue = $request->get($field);
                if ($dateValue && !$this->isValidFlexibleDate($dateValue)) {
                    $validator->errors()->add($field, "The {$field} field must be a valid date format (d/m/Y, Y-m-d, or d-m-Y).");
                }
            }
        });

        if ($validator->fails()) {
            Log::warning('PDF validation failed', [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->only(array_keys($rules))
            ]);

            return response()->json([
                'error' => 'Invalid parameters',
                'messages' => $validator->errors(),
                'valid_values' => $this->getValidationHelp()
            ], 400);
        }

        return true;
    }

    /**
     * Flexible date validation helper
     */
    private function isValidFlexibleDate($dateValue): bool
    {
        if (empty($dateValue)) return true;

        $formats = [
            'd/m/Y',    // 24/8/2025
            'Y-m-d',    // 2025-08-24
            'd-m-Y',    // 24-08-2025
            'd/m/y',    // 24/8/25
            'm/d/Y',    // 8/24/2025
            'Y/m/d'     // 2025/8/24
        ];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, trim($dateValue));
            if ($date && $date->format($format) === trim($dateValue)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Optimized chart request validation
     */
    private function validateChartRequestOptimized(Request $request)
    {
        $validator = Validator::make($request->all(), self::VALIDATION_RULES);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid chart parameters',
                'messages' => $validator->errors()
            ], 400);
        }

        return true;
    }

    /**
     * Process request data with optimized pipeline
     */
    private function processRequestDataOptimized(Request $request): array
    {
        // Parallel processing of different data sections
        $kpiData = $this->extractKpiDataOptimized($request);
        $chartData = $this->processChartDataOptimized($request);
        $dateRange = $this->processDateRangeOptimized($request);

        return [$kpiData, $chartData, $dateRange];
    }

    /**
     * Extract KPI data with enhanced safety and flexible date parsing
     */
    private function extractKpiDataOptimized(Request $request): array
    {
        $safeString = fn($value) => $value ? trim(strip_tags($value)) : '';

        $formatDate = function($dateValue) {
            if (!$dateValue) return '';

            try {
                // Try multiple date formats
                $formats = ['d/m/Y', 'Y-m-d', 'd-m-Y', 'd/m/y', 'm/d/Y', 'Y/m/d'];
                $dateValue = trim($dateValue);

                foreach ($formats as $format) {
                    $date = \DateTime::createFromFormat($format, $dateValue);
                    if ($date && $date->format($format) === $dateValue) {
                        return Carbon::instance($date)->locale('id')->translatedFormat('d F Y');
                    }
                }

                // Fallback: try Carbon's flexible parsing
                return Carbon::parse($dateValue)->locale('id')->translatedFormat('d F Y');

            } catch (\Exception $e) {
                Log::warning('Invalid date format', [
                    'date' => $dateValue,
                    'error' => $e->getMessage()
                ]);
                return $dateValue; // Return original if parsing fails
            }
        };

        return [
            // KPI Information
            'indikator' => $safeString($request->get('indikator')),
            'nama_indikator' => $safeString($request->get('nama_indikator')),
            'formula' => $safeString($request->get('formula')),
            'target' => $safeString($request->get('target')),
            'realisasi' => $safeString($request->get('realisasi')),
            'department' => $safeString($request->get('department')),

            // Signature Information with flexible date parsing
            'prepared_jabatan' => $safeString($request->get('prepared_jabatan')),
            'prepared_nama' => $safeString($request->get('prepared_nama')),
            'prepared_tanggal' => $formatDate($request->get('prepared_tanggal')),

            'approved_jabatan' => $safeString($request->get('approved_jabatan')),
            'approved_nama' => $safeString($request->get('approved_nama')),
            'approved_tanggal' => $formatDate($request->get('approved_tanggal')),

            'validated_jabatan' => $safeString($request->get('validated_jabatan')),
            'validated_nama' => $safeString($request->get('validated_nama')),
            'validated_tanggal' => $formatDate($request->get('validated_tanggal'))
        ];
    }

    /**
     * Process chart data with enhanced validation and error handling
     */
    private function processChartDataOptimized(Request $request): array
    {
        try {
            $chartImage = $request->get('chart_image');
            $chartDataJson = $request->get('chart_data');

            $result = [
                'chart_image' => null,
                'chart_data' => [],
                'has_chart' => false
            ];

            // Enhanced base64 image validation
            if ($chartImage && $this->isValidBase64Image($chartImage)) {
                $result['chart_image'] = $chartImage;
                $result['has_chart'] = true;
            }

            // Enhanced chart data validation
            if ($chartDataJson && $this->isValidJson($chartDataJson)) {
                $chartData = json_decode($chartDataJson, true);

                if ($this->isValidChartData($chartData)) {
                    $result['chart_data'] = $this->sanitizeChartData($chartData);
                }
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('Error processing chart data', [
                'error' => $e->getMessage(),
                'has_image' => !empty($request->get('chart_image')),
                'has_data' => !empty($request->get('chart_data'))
            ]);

            return ['chart_image' => null, 'chart_data' => [], 'has_chart' => false];
        }
    }

    /**
     * Optimized date range processing with enhanced validation
     */
    private function processDateRangeOptimized(Request $request): array
    {
        $dateMethod = $request->get('date_method', 'preset');
        $quarter = $request->get('quarter', 'IV');
        $year = (int) $request->get('year', date('Y'));
        $timeframe = $request->get('timeframe', 'days');

        try {
            if ($dateMethod === 'custom') {
                $startDate = Carbon::parse($request->get('start_date'))->startOfDay();
                $endDate = Carbon::parse($request->get('end_date'))->endOfDay();

                // Additional validation for custom dates
                if ($startDate->gt($endDate)) {
                    throw new \InvalidArgumentException('Start date cannot be after end date');
                }

                if ($startDate->lt(Carbon::now()->subYears(2))) {
                    throw new \InvalidArgumentException('Start date cannot be more than 2 years ago');
                }

            } else {
                $period = min((int) $request->get('period', self::DEFAULT_PERIOD_DAYS), self::MAX_DATE_RANGE_DAYS);
                [$startDate, $endDate] = $this->calculateDateRangeOptimized($timeframe, $period, $quarter, $year);
            }

            $days = $startDate->diffInDays($endDate) + 1;

            return [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days' => $days,
                'quarter' => $quarter,
                'year' => $year,
                'timeframe' => $timeframe,
                'date_method' => $dateMethod
            ];

        } catch (\Exception $e) {
            Log::error('Error processing date range', [
                'error' => $e->getMessage(),
                'date_method' => $dateMethod,
                'quarter' => $quarter,
                'year' => $year
            ]);

            // Fallback to safe defaults
            $endDate = Carbon::now()->endOfDay();
            $startDate = Carbon::now()->subDays(self::DEFAULT_PERIOD_DAYS)->startOfDay();

            return [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days' => self::DEFAULT_PERIOD_DAYS,
                'quarter' => 'IV',
                'year' => date('Y'),
                'timeframe' => 'days',
                'date_method' => 'preset'
            ];
        }
    }

    /**
     * Enhanced date range calculation with caching
     */
    private function calculateDateRangeOptimized(string $timeframe, int $period, string $quarter, int $year): array
    {
        $cacheKey = "date_range_{$timeframe}_{$period}_{$quarter}_{$year}";

        return Cache::remember($cacheKey, self::LONG_CACHE_TTL, function() use ($timeframe, $period, $quarter, $year) {
            switch ($timeframe) {
                case 'from_start':
                    return [
                        Carbon::create($year, 1, 1)->startOfDay(),
                        Carbon::now()->endOfDay()
                    ];

                case 'quarter':
                    return $this->getQuarterDateRangeOptimized($quarter, $year);

                case 'days':
                default:
                    $endDate = Carbon::now()->endOfDay();
                    $startDate = Carbon::now()->subDays($period - 1)->startOfDay();
                    return [$startDate, $endDate];
            }
        });
    }

    /**
     * Optimized quarter date range calculation
     */
    private function getQuarterDateRangeOptimized(string $quarter, int $year): array
    {
        if (!isset(self::QUARTERS[$quarter])) {
            $quarter = 'IV'; // Safe fallback
        }

        [$startMonth, $endMonth] = self::QUARTERS[$quarter];

        // Optimized end day calculation
        $endDay = match($endMonth) {
            2 => ($year % 4 === 0 && ($year % 100 !== 0 || $year % 400 === 0)) ? 29 : 28,
            4, 6, 9, 11 => 30,
            default => 31
        };

        return [
            Carbon::create($year, $startMonth, 1)->startOfDay(),
            Carbon::create($year, $endMonth, $endDay)->endOfDay()
        ];
    }

    /**
     * Generate report data with advanced caching and optimization
     */
    private function generateReportDataOptimized(array $kpiData, array $chartData, array $dateRange): array
    {
        $cacheKey = $this->generateCacheKey('report_data', [
            'start' => $dateRange['start_date']->format('Y-m-d'),
            'end' => $dateRange['end_date']->format('Y-m-d'),
            'days' => $dateRange['days']
        ]);

        $statistics = Cache::remember($cacheKey, self::CACHE_TTL, function() use ($dateRange) {
            return $this->getOptimizedStatistics($dateRange);
        });

        return array_merge($kpiData, [
            // Enhanced metadata
            'quarter' => (string) $dateRange['quarter'],
            'year' => (string) $dateRange['year'],
            'period_days' => (int) $dateRange['days'],
            'generated_date' => Carbon::now('Asia/Jakarta')->format('d/m/Y H:i:s'),
            'start_date' => $dateRange['start_date']->format('d/m/Y'),
            'end_date' => $dateRange['end_date']->format('d/m/Y'),

            // Core statistics
            'total_phones' => $statistics['total_nodes'],
            'online_phones' => $statistics['online_nodes'],
            'offline_phones' => $statistics['offline_nodes'],
            'partial_phones' => $statistics['partial_nodes'] ?? 0,
            'online_percentage' => $statistics['online_percentage'] . '%',
            'offline_percentage' => $statistics['offline_percentage'] . '%',
            'avg_uptime' => $statistics['avg_uptime'],

            // Enhanced chart data
            'chart_image' => $chartData['chart_image'],
            'chart_data' => $chartData['chart_data'],
            'has_chart' => $chartData['has_chart'],

            // Detailed table data
            'endpoints_data' => $statistics['endpoints_data'],
            'ranking_data' => $statistics['ranking_data'],
            'period_stats' => $statistics['period_stats'],
            'frequently_offline' => $statistics['frequently_offline'],

            // Enhanced metadata
            'report_title' => $this->generateReportTitle($dateRange['quarter'], $dateRange['year']),
            'period_description' => $this->generatePeriodDescription($dateRange),
            'generation_info' => [
                'version' => '2.0.0',
                'generated_at' => now()->toISOString(),
                'total_records' => $statistics['total_records'] ?? 0
            ]
        ]);
    }

    /**
     * Get optimized statistics with intelligent caching
     */
    private function getOptimizedStatistics(array $dateRange): array
    {
        $startTime = microtime(true);

        try {
            // Get latest statuses with optimized query
            $latestStatuses = $this->getLatestStatusesOptimized();

            // Calculate basic statistics
            $totalNodes = $latestStatuses->count();
            $onlineNodes = $latestStatuses->where('current_status', 'online')->count();
            $offlineNodes = $latestStatuses->where('current_status', 'offline')->count();
            $partialNodes = $latestStatuses->where('current_status', 'partial')->count();

            $onlinePercentage = $totalNodes > 0 ? round(($onlineNodes / $totalNodes) * 100, 1) : 0;
            $offlinePercentage = $totalNodes > 0 ? round(($offlineNodes / $totalNodes) * 100, 1) : 0;

            // Generate detailed data with parallel processing where possible
            $endpointsData = $this->generateEndpointsDataOptimized($latestStatuses, $dateRange);
            $rankingData = $this->generateRankingDataOptimized($endpointsData);
            $periodStats = $this->getPeriodStatisticsOptimized($dateRange);
            $frequentlyOffline = $this->getFrequentlyOfflineEndpointsOptimized($dateRange);
            $avgUptime = $this->calculateAverageUptimeOptimized($endpointsData);

            $executionTime = microtime(true) - $startTime;
            Log::info('Statistics generated', [
                'execution_time' => round($executionTime, 3),
                'total_nodes' => $totalNodes,
                'date_range_days' => $dateRange['days']
            ]);

            return [
                'total_nodes' => $totalNodes,
                'online_nodes' => $onlineNodes,
                'offline_nodes' => $offlineNodes,
                'partial_nodes' => $partialNodes,
                'online_percentage' => $onlinePercentage,
                'offline_percentage' => $offlinePercentage,
                'avg_uptime' => $avgUptime,
                'endpoints_data' => $endpointsData,
                'ranking_data' => $rankingData,
                'period_stats' => $periodStats,
                'frequently_offline' => $frequentlyOffline,
                'total_records' => count($endpointsData),
                'execution_time' => round($executionTime, 3)
            ];

        } catch (\Exception $e) {
            Log::error('Error generating optimized statistics', [
                'error' => $e->getMessage(),
                'date_range' => $dateRange
            ]);

            // Return safe defaults
            return $this->getSafeDefaultStatistics();
        }
    }

    /**
     * Get latest statuses with highly optimized query
     */
    private function getLatestStatusesOptimized()
    {
        $cacheKey = 'latest_statuses_' . date('Y-m-d-H-i');

        return Cache::remember($cacheKey, self::SHORT_CACHE_TTL, function() {
            return DB::table('device_history as dh1')
                ->select([
                    'dh1.endpoint',
                    'dh1.current_status',
                    'dh1.timestamp',
                    'dh1.node_name'
                ])
                ->whereIn('dh1.id', function($query) {
                    $query->selectRaw('MAX(id)')
                        ->from('device_history as dh2')
                        ->whereColumn('dh2.endpoint', 'dh1.endpoint')
                        ->groupBy('dh2.endpoint');
                })
                ->orderBy('dh1.endpoint')
                ->get();
        });
    }

    /**
     * Calculate chart statistics with advanced optimization
     */
    private function calculateChartStatisticsOptimized(array $dateRange): array
    {
        try {
            $cacheKey = $this->generateCacheKey('chart_stats', $dateRange);

            return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($dateRange) {
                $latestStatuses = $this->getLatestStatusesOptimized();
                $endpointsData = $this->generateEndpointsDataOptimized($latestStatuses, $dateRange);

                $totalDevices = count($endpointsData);
                $totalPossibleUptime = $totalDevices * 100;

                // Optimized uptime calculation
                $actualUptimeSum = array_sum(array_map(function($endpoint) {
                    return (float) str_replace('%', '', $endpoint['uptime_period'] ?? '0%');
                }, $endpointsData));

                $actualDowntime = max(0, $totalPossibleUptime - $actualUptimeSum);
                $uptimePercentage = $totalPossibleUptime > 0 ? ($actualUptimeSum / $totalPossibleUptime) * 100 : 0;
                $downtimePercentage = max(0, 100 - $uptimePercentage);

                return [
                    'total_devices' => $totalDevices,
                    'total_possible_uptime' => $totalPossibleUptime,
                    'actual_uptime' => $actualUptimeSum,
                    'actual_downtime' => $actualDowntime,
                    'uptime_percentage' => round($uptimePercentage, 1),
                    'downtime_percentage' => round($downtimePercentage, 1),
                    'period' => [
                        'start_date' => $dateRange['start_date']->format('Y-m-d'),
                        'end_date' => $dateRange['end_date']->format('Y-m-d'),
                        'days' => $dateRange['days']
                    ]
                ];
            });

        } catch (\Exception $e) {
            Log::error('Error calculating chart statistics', ['error' => $e->getMessage()]);
            return $this->getSafeDefaultChartStats();
        }
    }

    /**
     * Calculate real-time statistics with smart caching
     */
    private function calculateRealTimeStatsOptimized(): array
    {
        try {
            $latestStatuses = $this->getLatestStatusesOptimized();

            $totalDevices = $latestStatuses->count();
            $onlineDevices = $latestStatuses->where('current_status', 'online')->count();
            $offlineDevices = $latestStatuses->where('current_status', 'offline')->count();
            $partialDevices = $latestStatuses->where('current_status', 'partial')->count();

            // Safe division with validation
            $onlinePercentage = $totalDevices > 0 ? round(($onlineDevices / $totalDevices) * 100, 1) : 0;
            $offlinePercentage = $totalDevices > 0 ? round(($offlineDevices / $totalDevices) * 100, 1) : 0;
            $partialPercentage = $totalDevices > 0 ? round(($partialDevices / $totalDevices) * 100, 1) : 0;

            return [
                'total_devices' => $totalDevices,
                'online_devices' => $onlineDevices,
                'offline_devices' => $offlineDevices,
                'partial_devices' => $partialDevices,
                'online_percentage' => $onlinePercentage,
                'offline_percentage' => $offlinePercentage,
                'partial_percentage' => $partialPercentage,
                'timestamp' => Carbon::now()->toISOString(),
                'last_updated' => Carbon::now('Asia/Jakarta')->format('d/m/Y H:i:s')
            ];

        } catch (\Exception $e) {
            Log::error('Error calculating real-time stats', ['error' => $e->getMessage()]);
            return $this->getSafeDefaultRealTimeStats();
        }
    }

    /**
     * Generate endpoints data with batch processing and optimization
     */
    private function generateEndpointsDataOptimized($latestStatuses, array $dateRange): array
    {
        try {
            $endpoints = $latestStatuses->pluck('endpoint')->toArray();

            // Batch load nodes to prevent N+1 queries
            $nodes = Node::whereIn('endpoint', $endpoints)->get()->keyBy('endpoint');

            $endpointsData = [];
            $batchSize = 50; // Process in batches to prevent memory issues

            foreach (array_chunk($latestStatuses->toArray(), $batchSize) as $batch) {
                foreach ($batch as $status) {
                    try {
                        $endpoint = (object) $status;

                        // Use cached calculations where possible
                        $uptimeData = $this->calculateUptimeOptimized($endpoint->endpoint, $dateRange);
                        $statistics = $this->getEndpointStatisticsOptimized($endpoint->endpoint, $dateRange);

                        $node = $nodes->get($endpoint->endpoint);

                        $endpointsData[] = [
                            'endpoint' => (string) $endpoint->endpoint,
                            'building' => (string) ($node?->name ?? $endpoint->node_name ?? 'Unknown'),
                            'ip_address' => (string) ($node?->ip_address ?? 'Unknown'),
                            'current_status' => $this->formatStatus($endpoint->current_status),
                            'last_update' => Carbon::parse($endpoint->timestamp)->format('d/m/Y H:i:s'),
                            'uptime_period' => $uptimeData['uptimePercentage'] . '%',
                            'total_offline_duration' => $this->formatDuration($uptimeData['offlineMinutes'] ?? 0),
                            'total_events' => $statistics['total_events'],
                            'offline_events' => $statistics['offline_events'],
                            'online_events' => $statistics['online_events'],
                            'reliability_score' => $this->calculateReliabilityScore(
                                $uptimeData['uptimePercentage'],
                                $statistics['offline_events']
                            )
                        ];

                    } catch (\Exception $e) {
                        Log::warning('Error processing endpoint', [
                            'endpoint' => $endpoint->endpoint ?? 'unknown',
                            'error' => $e->getMessage()
                        ]);
                        continue;
                    }
                }
            }

            // Sort by reliability score (highest first)
            usort($endpointsData, fn($a, $b) => $b['reliability_score'] - $a['reliability_score']);

            return $endpointsData;

        } catch (\Exception $e) {
            Log::error('Error generating endpoints data', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Generate ranking data with optimization
     */
    private function generateRankingDataOptimized(array $endpointsData): array
    {
        try {
            return collect($endpointsData)
                ->filter(fn($data) => $data['offline_events'] > 0)
                ->sortByDesc('offline_events')
                ->take(self::RANKING_LIMIT)
                ->values()
                ->map(function($data, $index) {
                    $data['rank'] = $index + 1;
                    $data['last_activity'] = $data['last_update'] ?? 'Unknown';
                    return $data;
                })
                ->toArray();

        } catch (\Exception $e) {
            Log::error('Error generating ranking data', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get period statistics with enhanced optimization
     */
    private function getPeriodStatisticsOptimized(array $dateRange): array
    {
        try {
            $cacheKey = $this->generateCacheKey('period_stats', $dateRange);

            return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($dateRange) {
                $startDate = $dateRange['start_date'];
                $endDate = $dateRange['end_date'];

                // Single optimized query for all statistics
                $stats = DB::table('device_history')
                    ->whereBetween('timestamp', [$startDate, $endDate])
                    ->selectRaw('
                        COUNT(*) as total_events,
                        COUNT(CASE WHEN current_status = "offline" THEN 1 END) as offline_events,
                        COUNT(CASE WHEN current_status = "online" THEN 1 END) as online_events,
                        DATE(timestamp) as event_date
                    ')
                    ->groupBy('event_date')
                    ->orderByDesc('total_events')
                    ->first();

                // Most problematic endpoints
                $problematicEndpoints = DB::table('device_history')
                    ->whereBetween('timestamp', [$startDate, $endDate])
                    ->where('current_status', 'offline')
                    ->selectRaw('endpoint, COUNT(*) as offline_count')
                    ->groupBy('endpoint')
                    ->orderByDesc('offline_count')
                    ->limit(5)
                    ->get();

                return [
                    'total_events' => (int) ($stats->total_events ?? 0),
                    'offline_events' => (int) ($stats->offline_events ?? 0),
                    'online_events' => (int) ($stats->online_events ?? 0),
                    'most_active_day' => $stats ? [
                        'date' => Carbon::parse($stats->event_date)->format('d/m/Y'),
                        'events' => (int) $stats->total_events
                    ] : null,
                    'problematic_endpoints' => $problematicEndpoints->map(fn($item) => [
                        'endpoint' => (string) $item->endpoint,
                        'offline_count' => (int) $item->offline_count
                    ])->toArray()
                ];
            });

        } catch (\Exception $e) {
            Log::error('Error getting period statistics', ['error' => $e->getMessage()]);
            return $this->getSafeDefaultPeriodStats();
        }
    }

    /**
     * Get frequently offline endpoints with optimization
     */
    private function getFrequentlyOfflineEndpointsOptimized(array $dateRange): array
    {
        try {
            $cacheKey = $this->generateCacheKey('frequent_offline', $dateRange);

            return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($dateRange) {
                return DB::table('device_history')
                    ->select('endpoint')
                    ->selectRaw('COUNT(*) as offline_count')
                    ->whereBetween('timestamp', [$dateRange['start_date'], $dateRange['end_date']])
                    ->where('current_status', 'offline')
                    ->groupBy('endpoint')
                    ->orderByDesc('offline_count')
                    ->limit(self::FREQUENT_OFFLINE_LIMIT)
                    ->get()
                    ->map(fn($item) => [
                        'endpoint' => (string) $item->endpoint,
                        'offline_count' => (int) $item->offline_count
                    ])
                    ->toArray();
            });

        } catch (\Exception $e) {
            Log::error('Error getting frequently offline endpoints', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Calculate uptime with advanced optimization and caching
     */
    private function calculateUptimeOptimized(string $endpoint, array $dateRange): array
    {
        try {
            $cacheKey = $this->generateCacheKey('uptime', [
                'endpoint' => $endpoint,
                'start' => $dateRange['start_date']->format('Ymd'),
                'end' => $dateRange['end_date']->format('Ymd')
            ]);

            return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($endpoint, $dateRange) {
                $startDate = $dateRange['start_date'];
                $endDate = $dateRange['end_date'];

                // Optimized query to get status events
                $logs = DB::table('device_history')
                    ->where('endpoint', $endpoint)
                    ->whereBetween('timestamp', [$startDate, $endDate])
                    ->orderBy('timestamp')
                    ->get(['timestamp', 'current_status']);

                $totalMinutes = $startDate->diffInMinutes($endDate);

                if ($logs->isEmpty()) {
                    return [
                        'uptimePercentage' => 0.0,
                        'totalMinutes' => $totalMinutes,
                        'onlineMinutes' => 0,
                        'offlineMinutes' => 0,
                        'dataAvailable' => false
                    ];
                }

                // Enhanced uptime calculation algorithm
                $offlineMinutes = 0;
                $currentOfflineStart = null;
                $lastStatus = null;

                foreach ($logs as $log) {
                    $logTime = Carbon::parse($log->timestamp);
                    $status = $log->current_status;

                    if ($status === 'offline') {
                        if (!$currentOfflineStart) {
                            $currentOfflineStart = $logTime;
                        }
                    } elseif ($status === 'online' && $currentOfflineStart) {
                        $offlineMinutes += $currentOfflineStart->diffInMinutes($logTime);
                        $currentOfflineStart = null;
                    }

                    $lastStatus = $status;
                }

                // Handle case where device is still offline at end of period
                if ($currentOfflineStart && $lastStatus === 'offline') {
                    $offlineMinutes += $currentOfflineStart->diffInMinutes($endDate);
                }

                $onlineMinutes = max(0, $totalMinutes - $offlineMinutes);
                $uptimePercentage = $totalMinutes > 0 ? round(($onlineMinutes / $totalMinutes) * 100, 1) : 0.0;

                return [
                    'uptimePercentage' => $uptimePercentage,
                    'totalMinutes' => $totalMinutes,
                    'onlineMinutes' => $onlineMinutes,
                    'offlineMinutes' => $offlineMinutes,
                    'dataAvailable' => true
                ];
            });

        } catch (\Exception $e) {
            Log::error('Error calculating uptime', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);

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
     * Get endpoint statistics with batch optimization
     */
    private function getEndpointStatisticsOptimized(string $endpoint, array $dateRange): array
    {
        try {
            $cacheKey = $this->generateCacheKey('endpoint_stats', [
                'endpoint' => $endpoint,
                'start' => $dateRange['start_date']->format('Ymd'),
                'end' => $dateRange['end_date']->format('Ymd')
            ]);

            return Cache::remember($cacheKey, self::CACHE_TTL, function() use ($endpoint, $dateRange) {
                $stats = DB::table('device_history')
                    ->where('endpoint', $endpoint)
                    ->whereBetween('timestamp', [$dateRange['start_date'], $dateRange['end_date']])
                    ->selectRaw('
                        COUNT(*) as total_events,
                        COUNT(CASE WHEN current_status = "offline" THEN 1 END) as offline_events,
                        COUNT(CASE WHEN current_status = "online" THEN 1 END) as online_events
                    ')
                    ->first();

                return [
                    'total_events' => (int) ($stats->total_events ?? 0),
                    'offline_events' => (int) ($stats->offline_events ?? 0),
                    'online_events' => (int) ($stats->online_events ?? 0)
                ];
            });

        } catch (\Exception $e) {
            Log::error('Error getting endpoint statistics', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);

            return [
                'total_events' => 0,
                'offline_events' => 0,
                'online_events' => 0
            ];
        }
    }

    /**
     * Calculate average uptime with optimization
     */
    private function calculateAverageUptimeOptimized(array $endpointsData): float
    {
        try {
            if (empty($endpointsData)) {
                return 0.0;
            }

            $totalUptime = array_sum(array_map(function($endpoint) {
                return (float) str_replace('%', '', $endpoint['uptime_period'] ?? '0%');
            }, $endpointsData));

            return round($totalUptime / count($endpointsData), 1);

        } catch (\Exception $e) {
            Log::error('Error calculating average uptime', ['error' => $e->getMessage()]);
            return 0.0;
        }
    }

    /**
     * Calculate reliability score with enhanced algorithm
     */
    private function calculateReliabilityScore(float $uptimePercentage, int $offlineEvents): int
    {
        try {
            // Enhanced scoring algorithm
            $uptimeScore = $uptimePercentage * 0.6; // 60% weight for uptime
            $stabilityScore = max(0, 100 - ($offlineEvents * 3)) * 0.3; // 30% weight for stability
            $consistencyBonus = ($uptimePercentage > 95) ? 10 : 0; // 10% bonus for excellent uptime

            $score = $uptimeScore + $stabilityScore + $consistencyBonus;

            return (int) min(100, max(0, round($score)));

        } catch (\Exception $e) {
            Log::error('Error calculating reliability score', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    /**
     * Generate PDF with optimized settings and error handling
     */
    private function generateOptimizedPdf(array $reportData)
    {
        try {
            // Memory optimization before PDF generation
            if (function_exists('ini_set')) {
                ini_set('memory_limit', '512M');
                ini_set('max_execution_time', '300'); // 5 minutes
            }

            $pdf = Pdf::loadView('reports.phone-status-pdf', $reportData);

            return $pdf->setPaper('A4', 'portrait')
                ->setOptions([
                    'dpi' => 150,
                    'defaultFont' => 'DejaVu Sans',
                    'isRemoteEnabled' => true,
                    'isHtml5ParserEnabled' => true,
                    'chroot' => public_path(),
                    'enable_php' => false,
                    'debugKeepTemp' => false, // Clean up temp files
                    'debugCss' => false,
                    'debugLayout' => false,
                    'debugLayoutLines' => false,
                    'debugLayoutBlocks' => false,
                    'debugLayoutInline' => false,
                    'debugLayoutPaddingBox' => false
                ]);

        } catch (\Exception $e) {
            Log::error('PDF generation failed', [
                'error' => $e->getMessage(),
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true)
            ]);

            throw new \Exception('Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * Generate optimized PDF filename
     */
    private function generatePdfFilename(array $reportData): string
    {
        $quarter = $reportData['quarter'] ?? 'IV';
        $year = $reportData['year'] ?? date('Y');
        $period = $reportData['period_days'] ?? 30;
        $timestamp = date('Ymd_His');

        $sanitizedDepartment = preg_replace('/[^a-zA-Z0-9]/', '_', $reportData['department'] ?? 'TI');

        return "Laporan_KPI_Status_Telepon_Q{$quarter}_{$year}_{$period}hari_{$sanitizedDepartment}_{$timestamp}.pdf";
    }

    // =============================================================================
    // HELPER AND UTILITY METHODS
    // =============================================================================

    /**
     * Generate cache key with consistent hashing
     */
    private function generateCacheKey(string $prefix, array $params = []): string
    {
        ksort($params);
        $hash = md5(json_encode($params));
        return "{$prefix}_{$hash}";
    }

    /**
     * Validate base64 image with enhanced checks
     */
    private function isValidBase64Image(string $imageData): bool
    {
        try {
            // Check basic format
            if (!preg_match('/^data:image\/(png|jpeg|jpg);base64,/', $imageData)) {
                return false;
            }

            // Extract and validate base64 data
            $base64Data = preg_replace('/^data:image\/[^;]+;base64,/', '', $imageData);
            $decodedData = base64_decode($base64Data, true);

            if ($decodedData === false) {
                return false;
            }

            // Check reasonable size limits (max 5MB)
            if (strlen($decodedData) > 5 * 1024 * 1024) {
                return false;
            }

            return true;

        } catch (\Exception $e) {
            Log::warning('Base64 image validation failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Validate JSON string
     */
    private function isValidJson(string $jsonString): bool
    {
        json_decode($jsonString);
        return json_last_error() === JSON_ERROR_NONE;
    }

    /**
     * Validate chart data structure
     */
    private function isValidChartData(array $chartData): bool
    {
        $requiredFields = ['total_devices', 'uptime_percentage', 'downtime_percentage'];

        foreach ($requiredFields as $field) {
            if (!isset($chartData[$field]) || !is_numeric($chartData[$field])) {
                return false;
            }
        }

        // Additional validation
        if ($chartData['total_devices'] < 0 ||
            $chartData['uptime_percentage'] < 0 ||
            $chartData['uptime_percentage'] > 100 ||
            $chartData['downtime_percentage'] < 0 ||
            $chartData['downtime_percentage'] > 100) {
            return false;
        }

        return true;
    }

    /**
     * Sanitize chart data
     */
    private function sanitizeChartData(array $chartData): array
    {
        return [
            'total_devices' => (int) $chartData['total_devices'],
            'total_possible_uptime' => (float) ($chartData['total_possible_uptime'] ?? 0),
            'actual_uptime' => (float) ($chartData['actual_uptime'] ?? 0),
            'actual_downtime' => (float) ($chartData['actual_downtime'] ?? 0),
            'uptime_percentage' => round((float) $chartData['uptime_percentage'], 1),
            'downtime_percentage' => round((float) $chartData['downtime_percentage'], 1)
        ];
    }

    /**
     * Generate report title
     */
    private function generateReportTitle(string $quarter, string $year): string
    {
        return "LAPORAN KPI INVENTARISASI SISTEM KOMPUTER TRIWULAN {$quarter} TAHUN {$year}";
    }

    /**
     * Generate period description
     */
    private function generatePeriodDescription(array $dateRange): string
    {
        $start = $dateRange['start_date']->locale('id')->translatedFormat('d F Y');
        $end = $dateRange['end_date']->locale('id')->translatedFormat('d F Y');
        $days = $dateRange['days'];
        $timeframe = $dateRange['timeframe'] ?? 'days';

        return match($timeframe) {
            'from_start' => "Periode dari awal tahun sampai sekarang ({$start} - {$end}, {$days} hari)",
            'quarter' => "Periode triwulan ({$start} - {$end}, {$days} hari)",
            default => "Periode {$days} hari terakhir ({$start} - {$end})"
        };
    }

    /**
     * Format status with mapping
     */
    private function formatStatus(string $status): string
    {
        return self::STATUS_MAPPING[strtolower($status)] ?? 'Unknown';
    }

    /**
     * Enhanced duration formatting
     */
    private function formatDuration(int $minutes): string
    {
        if ($minutes < 1) return 'Kurang dari 1 menit';
        if ($minutes < 60) return $minutes . ' menit';

        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        if ($hours < 24) {
            return $remainingMinutes > 0 ? "{$hours}j {$remainingMinutes}m" : "{$hours} jam";
        }

        $days = intdiv($hours, 24);
        $remainingHours = $hours % 24;

        return $remainingHours > 0 ? "{$days}h {$remainingHours}j" : "{$days} hari";
    }

    /**
     * Get validation help for error responses
     */
    private function getValidationHelp(): array
    {
        return [
            'date_method' => ['preset', 'custom'],
            'quarter' => ['I', 'II', 'III', 'IV'],
            'timeframe' => ['days', 'from_start', 'quarter'],
            'format' => ['download', 'view'],
            'max_date_range' => self::MAX_DATE_RANGE_DAYS . ' days',
            'supported_date_formats' => ['d/m/Y (24/8/2025)', 'Y-m-d (2025-08-24)', 'd-m-Y (24-08-2025)']
        ];
    }

    /**
     * Safe default statistics
     */
    private function getSafeDefaultStatistics(): array
    {
        return [
            'total_nodes' => 0,
            'online_nodes' => 0,
            'offline_nodes' => 0,
            'partial_nodes' => 0,
            'online_percentage' => 0.0,
            'offline_percentage' => 0.0,
            'avg_uptime' => 0.0,
            'endpoints_data' => [],
            'ranking_data' => [],
            'period_stats' => [],
            'frequently_offline' => [],
            'total_records' => 0,
            'execution_time' => 0
        ];
    }

    /**
     * Safe default chart statistics
     */
    private function getSafeDefaultChartStats(): array
    {
        return [
            'total_devices' => 0,
            'total_possible_uptime' => 0,
            'actual_uptime' => 0,
            'actual_downtime' => 0,
            'uptime_percentage' => 0,
            'downtime_percentage' => 0,
            'period' => [
                'start_date' => now()->format('Y-m-d'),
                'end_date' => now()->format('Y-m-d'),
                'days' => 1
            ]
        ];
    }

    /**
     * Safe default real-time statistics
     */
    private function getSafeDefaultRealTimeStats(): array
    {
        return [
            'total_devices' => 0,
            'online_devices' => 0,
            'offline_devices' => 0,
            'partial_devices' => 0,
            'online_percentage' => 0.0,
            'offline_percentage' => 0.0,
            'partial_percentage' => 0.0,
            'timestamp' => Carbon::now()->toISOString(),
            'last_updated' => Carbon::now('Asia/Jakarta')->format('d/m/Y H:i:s')
        ];
    }

    /**
     * Safe default period statistics
     */
    private function getSafeDefaultPeriodStats(): array
    {
        return [
            'total_events' => 0,
            'offline_events' => 0,
            'online_events' => 0,
            'most_active_day' => null,
            'problematic_endpoints' => []
        ];
    }

    /**
     * Enhanced error response
     */
    private function errorResponse(string $message, int $code = 500): JsonResponse
    {
        return response()->json([
            'error' => true,
            'message' => $message,
            'timestamp' => now()->toISOString(),
            'code' => $code
        ], $code);
    }

    // =============================================================================
    // EXISTING OPTIMIZED API METHODS
    // =============================================================================

    /**
     * Get all history records with enhanced optimization
     */
    public function getAllHistory(Request $request): JsonResponse
    {
        try {
            $limit = min((int) $request->get('limit', self::DEFAULT_LIMIT), 1000);
            $page = max(1, (int) $request->get('page', 1));
            $offset = ($page - 1) * $limit;

            $cacheKey = "all_history_p{$page}_l{$limit}";

            $result = Cache::remember($cacheKey, self::CACHE_TTL, function() use ($limit, $offset) {
                $query = DeviceHistory::select([
                    'id', 'endpoint', 'node_name', 'current_status',
                    'timestamp', 'description'
                ])->orderByDesc('timestamp')->orderByDesc('id');

                $total = $query->count();

                if ($total > self::MAX_EXPORT_RECORDS) {
                    Log::warning('Large history query attempted', ['total' => $total]);
                }

                $history = $query->offset($offset)->limit($limit)->get();

                return [
                    'data' => $history->toArray(),
                    'total' => $total,
                    'per_page' => $limit,
                    'current_page' => intval($offset / $limit) + 1,
                    'last_page' => ceil($total / $limit)
                ];
            });

            // Handle export request
            if ($request->get('export') === 'csv') {
                return $this->exportToCsvOptimized($result['data']);
            }

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Failed to fetch history', ['error' => $e->getMessage()]);
            return $this->errorResponse('Failed to fetch history: ' . $e->getMessage());
        }
    }

    /**
     * Get history for specific endpoint with optimization
     */
    public function getHistory(string $endpoint, Request $request): JsonResponse
    {
        try {
            $limit = min((int) $request->get('limit', self::DEFAULT_LIMIT), 500);
            $cacheKey = "endpoint_history_{$endpoint}_{$limit}";

            $history = Cache::remember($cacheKey, self::CACHE_TTL, function() use ($endpoint, $limit) {
                return DeviceHistory::where('endpoint', $endpoint)
                    ->select(['id', 'current_status', 'previous_status', 'timestamp', 'description'])
                    ->orderByDesc('timestamp')
                    ->orderByDesc('id')
                    ->limit($limit)
                    ->get()
                    ->toArray();
            });

            return response()->json([
                'endpoint' => $endpoint,
                'data' => $history,
                'count' => count($history)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch endpoint history', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse('Failed to fetch endpoint history: ' . $e->getMessage());
        }
    }

    /**
     * Get statistics for specific endpoint with caching
     */
    public function getStats(string $endpoint): JsonResponse
    {
        try {
            $cacheKey = "endpoint_stats_{$endpoint}";

            $stats = Cache::remember($cacheKey, self::CACHE_TTL, function() use ($endpoint) {
                return DB::table('device_history')
                    ->where('endpoint', $endpoint)
                    ->selectRaw('
                        COUNT(*) as total_events,
                        COUNT(CASE WHEN current_status = "offline" THEN 1 END) as offline_events,
                        COUNT(CASE WHEN current_status = "online" THEN 1 END) as online_events,
                        MAX(timestamp) as last_activity
                    ')
                    ->first();
            });

            return response()->json([
                'endpoint' => $endpoint,
                'total_events' => (int) ($stats->total_events ?? 0),
                'offline_events' => (int) ($stats->offline_events ?? 0),
                'online_events' => (int) ($stats->online_events ?? 0),
                'last_activity' => $stats->last_activity ?
                    Carbon::parse($stats->last_activity)->format('d/m/Y H:i:s') : null
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch endpoint statistics', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse('Failed to fetch endpoint statistics: ' . $e->getMessage());
        }
    }

    /**
     * Get currently offline devices with optimization
     */
    public function getCurrentOfflineFromHistory(): JsonResponse
    {
        try {
            $cacheKey = 'current_offline_devices_' . date('Y-m-d-H-i');

            $result = Cache::remember($cacheKey, self::SHORT_CACHE_TTL, function() {
                $latestStatuses = $this->getLatestStatusesOptimized();

                $offlineDevices = $latestStatuses
                    ->where('current_status', 'offline')
                    ->map(function($status) {
                        return [
                            'endpoint' => $status->endpoint,
                            'node_name' => $status->node_name,
                            'current_status' => $this->formatStatus($status->current_status),
                            'last_update' => Carbon::parse($status->timestamp)->format('d/m/Y H:i:s'),
                            'duration_offline' => Carbon::parse($status->timestamp)->diffForHumans(null, true)
                        ];
                    })
                    ->values()
                    ->toArray();

                return [
                    'total_offline' => count($offlineDevices),
                    'offline_devices' => $offlineDevices,
                    'timestamp' => now()->toISOString()
                ];
            });

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Failed to fetch offline devices', ['error' => $e->getMessage()]);
            return $this->errorResponse('Failed to fetch offline devices: ' . $e->getMessage());
        }
    }

    /**
     * Update device status with enhanced validation
     */
    public function updateStatus(Request $request): JsonResponse
    {
        try {
            $rules = [
                'endpoint' => 'required|string|max:255',
                'node_name' => 'required|string|max:255',
                'previous_status' => 'required|string|in:online,offline,partial',
                'current_status' => 'required|string|in:online,offline,partial',
                'timestamp' => 'required|date|before_or_equal:now',
                'description' => 'nullable|string|max:500'
            ];

            $validated = $request->validate($rules);

            // Enhanced duplicate detection
            $existing = DeviceHistory::where([
                ['endpoint', $validated['endpoint']],
                ['timestamp', $validated['timestamp']],
                ['current_status', $validated['current_status']]
            ])->first();

            if ($existing) {
                return response()->json([
                    'message' => 'Status change already recorded',
                    'data' => $existing,
                    'duplicate' => true
                ], 200);
            }

            // Create new history record with enhanced data
            $history = DeviceHistory::create([
                'endpoint' => $validated['endpoint'],
                'node_name' => $validated['node_name'],
                'previous_status' => $validated['previous_status'],
                'current_status' => $validated['current_status'],
                'timestamp' => Carbon::parse($validated['timestamp']),
                'description' => $validated['description'] ?? $this->generateSmartDescription(
                    $validated['previous_status'],
                    $validated['current_status']
                ),
            ]);

            // Intelligent cache invalidation
            $this->invalidateRelatedCache($validated['endpoint']);

            return response()->json([
                'message' => 'Status updated successfully',
                'data' => $history,
                'cache_cleared' => true
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to update status', [
                'error' => $e->getMessage(),
                'request_data' => $request->only(['endpoint', 'current_status', 'timestamp'])
            ]);

            return $this->errorResponse('Failed to update status: ' . $e->getMessage());
        }
    }

    /**
     * Enhanced CSV export with streaming
     */
    private function exportToCsvOptimized($history)
    {
        $filename = 'phone_activity_logs_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        return response()->stream(function() use ($history) {
            $output = fopen('php://output', 'w');

            // UTF-8 BOM for proper encoding
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

            // Enhanced CSV headers
            fputcsv($output, [
                'ID', 'Endpoint', 'Node Name', 'Previous Status',
                'Current Status', 'Timestamp', 'Description',
                'Created At', 'Status Change Duration'
            ]);

            // Process data in chunks for memory efficiency
            foreach (collect($history)->chunk(100) as $chunk) {
                foreach ($chunk as $record) {
                    fputcsv($output, [
                        $record['id'] ?? '',
                        $record['endpoint'] ?? '',
                        $record['node_name'] ?? '',
                        $this->formatStatus($record['previous_status'] ?? ''),
                        $this->formatStatus($record['current_status'] ?? ''),
                        $record['timestamp'] ?? '',
                        $record['description'] ?? '',
                        $record['created_at'] ?? '',
                        $record['timestamp'] ? Carbon::parse($record['timestamp'])->diffForHumans() : ''
                    ]);
                }
            }

            fclose($output);
        }, 200, $headers);
    }

    /**
     * Generate smart description based on status change
     */
    private function generateSmartDescription(string $from, string $to): string
    {
        $timestamp = now()->format('H:i:s');

        return match([$from, $to]) {
            ['online', 'offline'], ['partial', 'offline'] => "Telepon tidak merespons sejak {$timestamp}",
            ['offline', 'online'], ['offline', 'partial'] => "Telepon kembali online pada {$timestamp}",
            ['offline', 'offline'] => "Telepon masih offline (konfirmasi {$timestamp})",
            ['online', 'online'] => "Telepon tetap online (heartbeat {$timestamp})",
            ['partial', 'online'] => "Telepon kembali fully online pada {$timestamp}",
            ['online', 'partial'] => "Telepon sedang digunakan sejak {$timestamp}",
            default => "Status berubah dari {$from} ke {$to} pada {$timestamp}"
        };
    }

    /**
     * Intelligent cache invalidation
     */
    private function invalidateRelatedCache(string $endpoint): void
    {
        try {
            $cacheKeys = [
                'current_offline_devices_' . date('Y-m-d-H-i'),
                "endpoint_history_{$endpoint}_" . self::DEFAULT_LIMIT,
                "endpoint_stats_{$endpoint}",
                'realtime_uptime_' . date('Y-m-d-H-i'),
                'latest_statuses_' . date('Y-m-d-H-i')
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            Log::info('Cache invalidated for endpoint', ['endpoint' => $endpoint]);

        } catch (\Exception $e) {
            Log::warning('Cache invalidation failed', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
        }
    }
}

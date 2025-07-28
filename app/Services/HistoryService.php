<?php

namespace App\Services;

use App\Models\RiwayatOff;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class HistoryService
{
    /**
     * Handle device status change
     */
    public function handleStatusChange($endpoint, $newStatus, $timestamp = null)
    {
        $timestamp = $timestamp ? Carbon::parse($timestamp) : Carbon::now();
        $isOnline = $this->isStatusOnline($newStatus);

        Log::info("Device status change", [
            'endpoint' => $endpoint,
            'status' => $newStatus,
            'is_online' => $isOnline,
            'timestamp' => $timestamp
        ]);

        if ($isOnline) {
            $this->handleDeviceOnline($endpoint, $timestamp);
        } else {
            $this->handleDeviceOffline($endpoint, $timestamp);
        }
    }

    /**
     * Handle device going online
     */
    private function handleDeviceOnline($endpoint, $timestamp)
    {
        // Cari catatan offline terakhir yang jam_on = null
        $latestOfflineRecord = RiwayatOff::getLatestOfflineRecord($endpoint);

        if ($latestOfflineRecord) {
            // Update jam_on untuk record offline terakhir
            $latestOfflineRecord->update([
                'jam_on' => $timestamp
            ]);

            Log::info("Updated offline record with online time", [
                'id' => $latestOfflineRecord->id,
                'endpoint' => $endpoint,
                'jam_off' => $latestOfflineRecord->jam_off,
                'jam_on' => $timestamp,
                'duration_minutes' => $latestOfflineRecord->duration
            ]);
        } else {
            Log::info("No pending offline record found for endpoint", [
                'endpoint' => $endpoint,
                'timestamp' => $timestamp
            ]);
        }
    }

    /**
     * Handle device going offline
     */
    private function handleDeviceOffline($endpoint, $timestamp)
    {
        // Cek apakah sudah ada catatan offline yang belum online (jam_on = null)
        $existingOfflineRecord = RiwayatOff::getLatestOfflineRecord($endpoint);

        if (!$existingOfflineRecord) {
            // Tidak ada catatan offline yang pending, buat baru
            $newRecord = RiwayatOff::create([
                'endpoint' => $endpoint,
                'jam_off' => $timestamp,
                'jam_on' => null
            ]);

            Log::info("Created new offline record", [
                'id' => $newRecord->id,
                'endpoint' => $endpoint,
                'jam_off' => $timestamp
            ]);
        } else {
            Log::info("Offline record already exists, skipping", [
                'existing_id' => $existingOfflineRecord->id,
                'endpoint' => $endpoint,
                'existing_jam_off' => $existingOfflineRecord->jam_off,
                'new_timestamp' => $timestamp
            ]);
        }
    }

    /**
     * Determine if status indicates device is online
     */
    private function isStatusOnline($status)
    {
        if (!$status) return false;

        $statusStr = strtolower($status);

        // Online indicators
        if (strpos($statusStr, 'not in use') !== false) return true;
        if (strpos($statusStr, 'available') !== false) return true;
        if (strpos($statusStr, 'in use') !== false) return true;
        if ($statusStr === 'online') return true;

        // Offline indicators
        if (strpos($statusStr, 'unavailable') !== false) return false;
        if (strpos($statusStr, '0 of') !== false) return false;
        if ($statusStr === 'offline') return false;

        // Default to offline for unknown status
        return false;
    }

    /**
     * Get history for an endpoint
     */
    public function getHistory($endpoint, $limit = 50)
    {
        return RiwayatOff::forEndpoint($endpoint)
                         ->latest('jam_off')
                         ->limit($limit)
                         ->get();
    }

    /**
     * Get current offline devices
     */
    public function getCurrentOfflineDevices()
    {
        return RiwayatOff::stillOffline()
                         ->with([])
                         ->get()
                         ->groupBy('endpoint')
                         ->map(function ($records) {
                             return $records->first(); // Get latest record for each endpoint
                         });
    }

    /**
     * Get statistics for an endpoint
     */
    public function getEndpointStats($endpoint, $days = 7)
    {
        $since = Carbon::now()->subDays($days);

        $records = RiwayatOff::forEndpoint($endpoint)
                             ->where('jam_off', '>=', $since)
                             ->get();

        $totalOfflineEvents = $records->count();
        $totalOfflineMinutes = $records->whereNotNull('jam_on')->sum('duration');
        $currentlyOffline = $records->whereNull('jam_on')->isNotEmpty();

        return [
            'endpoint' => $endpoint,
            'period_days' => $days,
            'total_offline_events' => $totalOfflineEvents,
            'total_offline_minutes' => $totalOfflineMinutes,
            'total_offline_formatted' => $this->formatDuration($totalOfflineMinutes),
            'currently_offline' => $currentlyOffline,
            'uptime_percentage' => $this->calculateUptimePercentage($totalOfflineMinutes, $days * 24 * 60)
        ];
    }

    /**
     * Format duration in minutes to human readable
     */
    private function formatDuration($minutes)
    {
        if (!$minutes || $minutes < 1) {
            return '0 menit';
        }

        if ($minutes < 60) {
            return $minutes . ' menit';
        }

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;

        if ($hours < 24) {
            return $remainingMinutes > 0 ? "{$hours}j {$remainingMinutes}m" : "{$hours} jam";
        }

        $days = floor($hours / 24);
        $remainingHours = $hours % 24;
        return $remainingHours > 0 ? "{$days}h {$remainingHours}j" : "{$days} hari";
    }

    /**
     * Calculate uptime percentage
     */
    private function calculateUptimePercentage($offlineMinutes, $totalMinutes)
    {
        if ($totalMinutes <= 0) return 100;

        $uptimeMinutes = $totalMinutes - $offlineMinutes;
        return round(($uptimeMinutes / $totalMinutes) * 100, 2);
    }
}
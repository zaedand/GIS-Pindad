<?php

namespace App\Http\Controllers;

use App\Services\HistoryService;
use Illuminate\Http\Request;
use App\Models\RiwayatOff;

class HistoryController extends Controller
{
    protected $historyService;

    public function __construct(HistoryService $historyService)
    {
        $this->historyService = $historyService;
    }

    /**
     * Get history for specific endpoint
     */
    public function getHistory($endpoint, Request $request)
    {
        $limit = $request->get('limit', 50);
        $history = $this->historyService->getHistory($endpoint, $limit);

        return response()->json([
            'endpoint' => $endpoint,
            'history' => $history,
            'total' => $history->count()
        ]);
    }

    /**
     * Get all currently offline devices
     */
    public function getCurrentOffline()
    {
        $offlineDevices = $this->historyService->getCurrentOfflineDevices();

        return response()->json([
            'offline_devices' => $offlineDevices,
            'count' => $offlineDevices->count()
        ]);
    }

    /**
     * Get statistics for endpoint
     */
    public function getStats($endpoint, Request $request)
    {
        $days = $request->get('days', 7);
        $stats = $this->historyService->getEndpointStats($endpoint, $days);

        return response()->json($stats);
    }

    /**
     * Get all history with pagination
     */
    public function getAllHistory(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $endpoint = $request->get('endpoint');

        $query = RiwayatOff::with([])
                           ->latest('jam_off');

        if ($endpoint) {
            $query->forEndpoint($endpoint);
        }

        $history = $query->paginate($perPage);

        return response()->json($history);
    }

    /**
     * Manual status update (for testing)
     */
    public function updateStatus(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
            'status' => 'required|string',
            'timestamp' => 'nullable|date'
        ]);

        $this->historyService->handleStatusChange(
            $request->endpoint,
            $request->status,
            $request->timestamp
        );

        return response()->json([
            'message' => 'Status updated successfully',
            'endpoint' => $request->endpoint,
            'status' => $request->status
        ]);
    }
}


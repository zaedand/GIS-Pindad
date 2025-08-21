<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NodeController;
use App\Http\Controllers\HistoryController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Resource Node
Route::apiResource('nodes', NodeController::class)
    ->parameters(['nodes' => 'node'])
    ->middleware(['auth:sanctum', 'throttle:api']);

// History group
Route::prefix('history')->middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/endpoint/{endpoint}', [HistoryController::class, 'getHistory']);
    Route::get('/endpoint/{endpoint}/stats', [HistoryController::class, 'getStats']);
    Route::get('/offline', [HistoryController::class, 'getCurrentOffline']);
    Route::get('/all', [HistoryController::class, 'getAllHistory']);
    Route::post('/update-status', [HistoryController::class, 'updateStatus']);

    // Export PDF (GET API)
    Route::get('/export-pdf', [HistoryController::class, 'exportPdf']);
});

// API for charts
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/chart-data', [HistoryController::class, 'getChartData']);
    Route::get('/realtime-uptime-data', [HistoryController::class, 'getRealTimeUptimeData']);
});

// Testing routes
Route::get('/test-public', fn() => response()->json([
    'message' => 'Public API working',
    'laravel' => app()->version()
]));

Route::middleware(['auth:sanctum', 'throttle:api'])->get('/test', fn() => response()->json([
    'message' => 'API working',
    'user' => auth()->user(),
    'laravel' => app()->version()
]));

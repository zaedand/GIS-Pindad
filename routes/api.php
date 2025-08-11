<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NodeController;
use App\Http\Controllers\HistoryController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Gunakan middleware dengan rate limiter yang sudah didefinisikan
Route::apiResource('nodes', NodeController::class)
    ->parameters(['nodes' => 'node'])
    ->middleware(['auth:sanctum', 'throttle:api']);

Route::prefix('history')->middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/endpoint/{endpoint}', [HistoryController::class, 'getHistory']);
    Route::get('/endpoint/{endpoint}/stats', [HistoryController::class, 'getStats']);
    Route::get('/offline', [HistoryController::class, 'getCurrentOffline']);
    Route::get('/all', [HistoryController::class, 'getAllHistory']);
    Route::post('/update-status', [HistoryController::class, 'updateStatus']);

    Route::get('/export-pdf', [HistoryController::class, 'exportPdf']);
});

// Testing routes
Route::get('/test-public', function () {
    return response()->json(['message' => 'Public API working', 'laravel' => app()->version()]);
});

Route::get('/test', function () {
    return response()->json([
        'message' => 'API working',
        'user' => auth()->user(),
        'laravel' => app()->version()
    ]);
})->middleware(['auth:sanctum', 'throttle:api']);

<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NodeController;
use App\Http\Controllers\HistoryController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Gunakan hanya apiResource dengan binding yang benar
Route::apiResource('nodes', NodeController::class)->parameters([
    'nodes' => 'node'
]);
Route::prefix('history')->group(function () {
    Route::get('/endpoint/{endpoint}', [HistoryController::class, 'getHistory']);
    Route::get('/endpoint/{endpoint}/stats', [HistoryController::class, 'getStats']);
    Route::get('/offline', [HistoryController::class, 'getCurrentOffline']);
    Route::get('/all', [HistoryController::class, 'getAllHistory']);
    Route::post('/update-status', [HistoryController::class, 'updateStatus']);
});
<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NodeController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Gunakan hanya apiResource dengan binding yang benar
Route::apiResource('nodes', NodeController::class)->parameters([
    'nodes' => 'node'
]);
Route::put('/nodes/{node}/status', [NodeController::class, 'updateStatus']);
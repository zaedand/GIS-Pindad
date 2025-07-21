<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NodeController;
use App\Models\Node;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Contoh route untuk auth
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// CRUD route untuk Node dengan model binding
Route::apiResource('nodes', NodeController::class)->parameters([
    'nodes' => 'node'
]);

// Route untuk update status satu node dari Socket.IO atau monitoring eksternal
Route::put('/nodes/{node}/status', [NodeController::class, 'updateStatus'])->name('nodes.updateStatus');

// Route opsional: update status massal dari banyak node sekaligus (optional)
Route::post('/nodes/status-sync', function (Request $request) {
    $data = $request->all();

    foreach ($data as $incoming) {
        $node = Node::where('endpoint', $incoming['endpoint'])->first();

        if ($node) {
            $node->status = $incoming['status'];
            $node->last_ping = $incoming['timestamp'] ?? now(); // kolom benar: last_ping
            $node->save();
        }
    }

    return response()->json(['message' => 'Status updated successfully.']);
});

// Route statistik untuk dashboard (opsional)
Route::get('/nodes-stats', [NodeController::class, 'getStats'])->name('nodes.stats');

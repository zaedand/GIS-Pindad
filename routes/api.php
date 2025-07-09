<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NodeController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


   Route::get('/nodes', [NodeController::class, 'index']);
   Route::post('/nodes', [NodeController::class, 'store']);
   Route::get('/nodes/{id}', [NodeController::class, 'show']);
   Route::put('/nodes/{id}', [NodeController::class, 'update']);
   Route::delete('/nodes/{id}', [NodeController::class, 'destroy']);

<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ManageController;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth'])->name('dashboard');

Route::get('/logs', function () {
    return view('logs');
})->middleware(['auth'])->name('logs');


Route::middleware(['auth'])->group(function () {
    Route::get('/manage', [ManageController::class, 'index'])->name('manage.index');
    Route::get('/api/extensions', [ManageController::class, 'getExtensionsStatus']);
});

Route::get('/tes', function () {
    return view('tes');
});
// routes/web.php
// routes/api.php - tambahkan di atas route yang ada
Route::get('/test', function () {
    return response()->json(['message' => 'API working', 'user' => auth()->user()]);
})->middleware('auth:sanctum');

Route::get('/test-public', function () {
    return response()->json(['message' => 'Public API working']);
});
Route::get('/test-token', function () {
    if (auth()->check()) {
        $token = auth()->user()->createToken('test-token')->plainTextToken;
        return response()->json(['token' => $token]);
    }
    return response()->json(['error' => 'Not authenticated'], 401);
})->middleware('auth');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

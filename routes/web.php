<?php
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ManageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LogsController;
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return view('welcome');
});

// Akses untuk user dan admin
Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'role:user,admin'])->name('dashboard');
Route::get('/logs', [LogsController::class, 'index'])->middleware(['auth', 'role:user,admin'])->name('logs');

// Akses khusus admin
// Route::middleware(['auth', 'role:admin'])->group(function () {
//     Route::get('/users', [UserController::class, 'index'])->name('users.index');
//     Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
// });
// Route::get('/users', function () {
//     return view('users');
// })->middleware(['auth', 'role:admin'])->name('users');
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/manage', [ManageController::class, 'index'])->name('manage.index');
    Route::get('/api/extensions', [ManageController::class, 'getExtensionsStatus']);
});

// Akses semua yang login (tanpa cek role)
Route::middleware(['auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

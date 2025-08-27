<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Buat akun admin
        User::create([
            'name' => 'Admin',
            'email' => 'admin@email.com',
            'password' => Hash::make('admin123'), 
            'role' => 'admin',
        ]);

        // Buat akun user biasa
        User::create([
            'name' => 'User',
            'email' => 'user@email.com',
            'password' => Hash::make('user123'),
            'role' => 'user',
        ]);
    }
}

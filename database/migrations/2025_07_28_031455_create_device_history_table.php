<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('device_history', function (Blueprint $table) {
            $table->id();
            $table->string('endpoint')->index();
            $table->string('node_name');
            $table->enum('previous_status', ['online', 'offline', 'partial'])->nullable();
            $table->enum('current_status', ['online', 'offline', 'partial']);
            $table->timestamp('timestamp')->index();
            $table->text('description')->nullable();
            $table->integer('duration')->nullable(); // durasi dalam menit
            $table->timestamps();

            // Indexes for better performance
            $table->index(['endpoint', 'timestamp']);
            $table->index(['current_status', 'timestamp']);
            $table->index(['endpoint', 'current_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_history');
    }
};
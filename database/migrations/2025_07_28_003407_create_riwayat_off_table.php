<?php
// Database Migration
// create_riwayat_off_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('riwayat_off', function (Blueprint $table) {
            $table->id();
            $table->string('endpoint');
            $table->timestamp('jam_off');
            $table->timestamp('jam_on')->nullable();
            $table->timestamps();

            $table->index(['endpoint', 'jam_on']);
            $table->index(['endpoint', 'jam_off']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('riwayat_off');
    }
};
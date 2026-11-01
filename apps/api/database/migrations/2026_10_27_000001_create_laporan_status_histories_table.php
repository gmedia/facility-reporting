<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('laporan_id')->constrained('laporans')->onDelete('cascade');
            $table->string('status_from')->nullable();
            $table->string('status_to');
            $table->string('alasan')->nullable();
            $table->foreignId('changed_by')->constrained('users');
            $table->timestamps();

            $table->index(['laporan_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_status_histories');
    }
};

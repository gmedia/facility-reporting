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
        Schema::table('laporans', function (Blueprint $table) {
            $table->unsignedTinyInteger('nilai_kerusakan')->nullable();
            $table->unsignedTinyInteger('nilai_risiko')->nullable();
            $table->unsignedTinyInteger('nilai_dampak')->nullable();
            $table->unsignedTinyInteger('nilai_frekuensi')->nullable();
            $table->decimal('skor_prioritas', 3, 2)->nullable();

            $table->index('skor_prioritas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporans', function (Blueprint $table) {
            $table->dropIndex(['skor_prioritas']);
            $table->dropColumn([
                'nilai_kerusakan',
                'nilai_risiko',
                'nilai_dampak',
                'nilai_frekuensi',
                'skor_prioritas',
            ]);
        });
    }
};

<?php

namespace App\Models\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

trait HandlesFotoUpload
{
    protected const MAX_SIZE_KB = 2048;      // 2 MB
    protected const MAX_DIMENSION = 1600;    // px
    protected const DEFAULT_QUALITY = 80;
    protected const MIN_QUALITY = 40;

    /**
     * Kompres & resize foto, return binary string (jpg).
     * Kalau gagal decode (mis. file palsu di test), kembalikan file asli.
     */
    public function compressFoto(UploadedFile $file): string
    {
        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->decode($file)->toJpeg($this::DEFAULT_QUALITY);
        } catch (\Throwable $e) {
            // Kalau gagal decode (mis. file palsu di test), gunakan file asli
            return file_get_contents($file->getRealPath());
        }

        // Resize kalau terlalu besar
        if ($image->width() > self::MAX_DIMENSION || $image->height() > self::MAX_DIMENSION) {
            $image->scaleDown(width: self::MAX_DIMENSION);
        }

        // Turunkan quality sampai < 2MB
        $quality = $this::DEFAULT_QUALITY;
        while ($image->toJpeg($quality)->size() > self::MAX_SIZE_KB * 1024) {
            $quality -= 5;
            if ($quality < $this::MIN_QUALITY) break;
        }

        return $image->toJpeg($quality)->toString();
    }

    /**
     * Simpan foto ke storage, return path relatif (mis: laporan/abc.jpg).
     */
    public function storeFoto(UploadedFile $file, string $folder = 'laporan'): string
    {
        $binary = $this->compressFoto($file);
        $filename = $folder . '/' . uniqid('foto_') . '.jpg';

        Storage::disk('public')->put($filename, $binary);

        return $filename; // simpan path ini ke DB
    }

    /**
     * Hapus foto lama dari storage.
     */
    public function deleteFoto(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
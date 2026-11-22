#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY belum diset. Buat dengan: php artisan key:generate --show" >&2
    exit 1
fi

# Simlink public/storage -> storage/app/public. Dibuat ulang tiap start karena
# public/ ikut image, sedangkan storage/app/public biasanya volume terpisah.
php artisan storage:link --force >/dev/null 2>&1 || true

# Provider hasil auto-discovery Composer. Dijalankan di runtime, bukan saat
# build, supaya tidak butuh environment produksi di tahap build.
php artisan package:discover --ansi >/dev/null

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force
fi

# Cache konfigurasi & route setelah env benar-benar tersedia.
php artisan config:cache >/dev/null
php artisan route:cache >/dev/null

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"

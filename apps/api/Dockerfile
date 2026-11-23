# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Tahap 1: dependency Composer tanpa dev.
# Dipisah supaya layer ini hanya dibangun ulang kalau composer.lock berubah.
# ---------------------------------------------------------------------------
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
        --no-dev \
        --no-interaction \
        --no-progress \
        --no-scripts \
        --prefer-dist \
        --ignore-platform-reqs

COPY . .

RUN composer dump-autoload --no-dev --optimize --no-scripts


# ---------------------------------------------------------------------------
# Tahap 2: runtime PHP.
# `artisan serve` dipakai karena sederhana dan cukup untuk demo/tugas.
# Kalau nanti trafiknya naik, ganti ke php-fpm + nginx atau Laravel Octane.
# ---------------------------------------------------------------------------
FROM php:8.5-cli-alpine

# `mbstring` dan `opcache` sudah ada di image resmi. Jangan pakai `-j`:
# target `install-modules` di helper Docker bisa balapan dan gagal dengan
# "cp: can't stat 'modules/*'".
# `gd` dibutuhkan `intervention/image` untuk kompres foto laporan
# (lihat App\Models\Concerns\HandlesFotoUpload), jadi libpng/libjpeg/freetype
# ikut dipasang sebelum ekstensinya dikompilasi.
#
# PENTING: semua ekstensi harus di-install dalam SATU panggilan
# `docker-php-ext-install`. Helper Docker menghapus `/usr/src/php` di akhir
# pemanggilan pertama (`.docker-delete-me`), sehingga hasil
# `docker-php-ext-configure gd` ikut hilang dan `gd` ter-build tanpa
# JPEG/FreeType kalau `gd` di-install terpisah.
RUN apk add --no-cache --virtual .build-deps \
        postgresql-dev icu-dev libpng-dev libjpeg-turbo-dev freetype-dev \
    && apk add --no-cache postgresql-libs icu-libs libpng libjpeg-turbo freetype \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql intl pcntl gd \
    && apk del .build-deps

WORKDIR /var/www/html

COPY --from=vendor /app /var/www/html
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p \
        storage/app/public \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache public

USER www-data

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

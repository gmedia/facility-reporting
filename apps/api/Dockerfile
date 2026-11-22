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
RUN apk add --no-cache postgresql-dev icu-dev \
    && docker-php-ext-install pdo_pgsql \
    && docker-php-ext-install intl \
    && docker-php-ext-install pcntl

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

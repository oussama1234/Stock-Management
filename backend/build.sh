#!/bin/bash
set -e

echo "Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev

echo "Generating application key if needed..."
if [ ! -f .env ]; then
    cp .env.example .env
    php artisan key:generate --force
fi

echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Creating storage directories..."
mkdir -p storage/framework/{sessions,views,cache}
mkdir -p storage/logs
mkdir -p bootstrap/cache

echo "Setting permissions..."
chmod -R 755 storage bootstrap/cache

echo "Build completed successfully!"
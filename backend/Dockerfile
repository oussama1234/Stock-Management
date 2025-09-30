# Use official PHP image with Composer and extensions
FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    unzip \
    git \
    curl \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy only the backend folder (where composer.json lives)
COPY backend/ ./

# Install PHP dependencies
RUN composer install --no-interaction --no-dev --optimize-autoloader

# Laravel permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose port (Render uses $PORT)
EXPOSE 10000

# Start Laravel built-in server on Render's PORT
CMD php artisan serve --host=0.0.0.0 --port=${PORT}

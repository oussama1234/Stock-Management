# Use PHP CLI image
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

# Copy Laravel backend files only
COPY backend/ ./

# Install PHP dependencies
RUN composer install --no-interaction --no-dev --optimize-autoloader

# Set Laravel storage permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose the dynamic port Render provides
EXPOSE ${PORT}

# Start Laravel dev server on the Render-assigned port
CMD php artisan serve --host=0.0.0.0 --port=${PORT} --quiet


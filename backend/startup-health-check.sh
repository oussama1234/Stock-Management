#!/bin/bash

echo "🚀 Laravel Application Startup Health Check"
echo "=========================================="

# Wait for database to be ready
echo "📊 Checking database connection..."
php artisan migrate:status > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection OK"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check if queue workers are running (in containerized environment)
if [ -n "$CONTAINER_ROLE" ] && [ "$CONTAINER_ROLE" != "queue" ]; then
    echo "🔍 Checking queue worker status..."
    php artisan queue:ensure-running --check > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Queue workers are healthy"
    else
        echo "⚠️ Queue workers might not be running - check laravel_queue container"
    fi
else
    echo "📋 Skipping queue check (running in queue container or non-containerized)"
fi

# Clear any application caches
echo "🧹 Clearing application caches..."
php artisan config:clear > /dev/null 2>&1
php artisan route:clear > /dev/null 2>&1
php artisan view:clear > /dev/null 2>&1

# Check storage permissions
echo "📁 Checking storage permissions..."
if [ -w "storage/logs" ] && [ -w "storage/framework" ]; then
    echo "✅ Storage permissions OK"
else
    echo "⚠️ Storage permissions might be incorrect"
fi

echo ""
echo "🎉 Application startup health check completed!"
echo "📱 Frontend: http://localhost:5173"
echo "🚀 Backend: http://localhost:8000"
echo "💾 PHPMyAdmin: http://localhost:8080"
if [ "$CONTAINER_ROLE" = "queue" ]; then
    echo "⚙️ Queue Worker: Running in this container"
else
    echo "⚙️ Queue Worker: Check docker-compose ps laravel_queue"
fi
echo ""
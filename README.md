🚀 Laravel + React + PHP-FPM + Nginx + MySQL (Dockerized)

This project provides a Dockerized setup for Laravel (backend), React (frontend), PHP-FPM, Nginx, and MySQL.

📦 Installation

# Build containers
docker-compose build

# Start containers
docker-compose up -d

# Stop containers
docker-compose down

⚙️ Laravel Setup

# Copy .env example
cp backend/.env.example backend/.env

# Install dependencies
docker-compose exec laravel composer install

# Generate app key
docker-compose exec laravel php artisan key:generate

# Run migrations
docker-compose exec laravel php artisan migrate

# Seed database
docker-compose exec laravel php artisan db:seed



🌍 Access Points

React Frontend → http://localhost:5173
Nginx (Main Laravel App) → http://localhost:8000/
PhpMyAdmin → http://localhost:8080
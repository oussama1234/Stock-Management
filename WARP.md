# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with Dockerized Laravel backend and React (Vite) frontend.
- Orchestrated via docker-compose with separate services for PHP-FPM (laravel_app), Nginx, MySQL, phpMyAdmin, and the React dev server.
- Primary dev loop is containerized; frontend also has npm scripts for local usage if desired.

Common commands (Windows PowerShell)
Note: If your Docker uses Compose v2, prefer `docker compose` (with a space). If you have Compose v1, `docker-compose` also works.

Repo-level
- Build all services:
  - docker compose build
- Start in background:
  - docker compose up -d
- Stop and remove containers:
  - docker compose down
- Tail logs for a service (e.g., nginx):
  - docker compose logs -f nginx
- Exec into a service shell (e.g., laravel_app):
  - docker compose exec laravel_app bash

Backend (Laravel)
Initial setup (first run):
1) Copy environment file
   - cp backend/.env.example backend/.env
2) Install PHP dependencies (inside container)
   - docker compose exec laravel_app composer install
3) Generate app key
   - docker compose exec laravel_app php artisan key:generate
4) Run migrations
   - docker compose exec laravel_app php artisan migrate
5) Seed database (optional but recommended for dev)
   - docker compose exec laravel_app php artisan db:seed

Everyday tasks:
- Run all backend tests
  - docker compose exec laravel_app php artisan test
- Run a single test class (filter)
  - docker compose exec laravel_app php artisan test --filter=SomeTestClass
- Run a single test method
  - docker compose exec laravel_app php artisan test --filter=SomeTestClass::test_some_behavior
- Run specific artisan commands (examples)
  - docker compose exec laravel_app php artisan route:list
  - docker compose exec laravel_app php artisan migrate:fresh --seed

Frontend (React + Vite)
The React dev server runs in a container by default (react_app) on http://localhost:5173. If you prefer running locally instead of Docker:
- Install deps: 
  - pushd frontend; npm ci; popd
- Start dev server locally:
  - pushd frontend; npm run dev; popd
- Build:
  - pushd frontend; npm run build; popd
- Lint:
  - pushd frontend; npm run lint; popd

Service endpoints
- Frontend (Vite dev): http://localhost:5173
- Laravel via Nginx: http://localhost:8000/
- phpMyAdmin: http://localhost:8080
- MySQL: localhost:3306 (container: mysql_db)

High-level architecture
- Containers and networking
  - Services are defined in docker-compose.yml under a shared bridge network (app-network).
  - laravel_app (php-fpm) mounts ./backend into /var/www/html and exposes PHP-FPM on port 9000 within the network.
  - nginx uses ./nginx/default.conf (or nginx/conf.d/default.conf) and serves the Laravel public/ directory at port 80; mapped to host 8000.
  - mysql_db persists data via the named Docker volume db_data.
  - phpmyadmin connects to mysql_db and is exposed on host 8080.
  - react_app mounts ./frontend, installs dependencies, and runs `npm run dev -- --host` listening on 5173, mapped to host.

- Nginx → PHP-FPM wiring
  - Nginx fastcgi_pass is set to laravel_app:9000.
  - Root is /var/www/html/public with a standard Laravel front controller (index.php) and try_files fallback to route non-static requests.

- Backend (Laravel)
  - Expects environment from backend/.env (example in backend/.env.example).
  - Uses MySQL (service mysql_db) with defaults from .env example (DB_DATABASE=stock_db, DB_USERNAME=laravel, DB_PASSWORD=secret).
  - CORS and Sanctum setup is oriented to the Vite dev server origins (localhost:5173). Sessions and caching are configured to database drivers by default in the provided .env.example.

- Frontend (React + Vite)
  - Vite config defines alias @ → ./src and enables Tailwind via @tailwindcss/vite.
  - The dev server is configured to host 0.0.0.0 and watch in polling mode for better DX inside containers.
  - ESLint is configured (eslint.config.js) and the npm script `npm run lint` is available.

Important notes from repository docs
- Root README.md documents the Dockerized workflow and Laravel setup steps. Follow those steps on first run to install Composer deps, generate APP_KEY, migrate, and seed the DB.
- Nginx configs are in ./nginx (both default.conf and conf.d/default.conf are present). The docker-compose.yml references ./nginx/default.conf.

Troubleshooting pointers
- If frontend changes don’t hot-reload in Docker on Windows, the Vite server is already configured with polling; ensure file sharing is enabled for your repo path in Docker Desktop.
- If Laravel can’t connect to MySQL, verify your backend/.env DB_* values match docker-compose (DB_HOST=mysql_db, DB_PORT=3306) and that the mysql_db service is healthy.
- Permission issues in storage/ or bootstrap/cache can be resolved by ensuring the container user (www-data) owns those paths; rebuild or adjust permissions if needed.

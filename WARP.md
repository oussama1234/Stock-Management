# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with a Laravel 12 backend (GraphQL + REST) and a React (Vite) frontend.
- Dockerized dev environment: PHP-FPM + Nginx + MySQL + phpMyAdmin + Node for the frontend dev server.

Quick start (Docker)
- Build and start services
  - docker-compose build
  - docker-compose up -d
- One-time Laravel setup (inside the PHP app service)
  - docker-compose exec laravel_app cp .env.example .env
  - docker-compose exec laravel_app composer install
  - docker-compose exec laravel_app php artisan key:generate
  - docker-compose exec laravel_app php artisan migrate --seed
- Access points
  - Frontend (Vite): http://localhost:5173
  - Backend (Nginx → Laravel): http://localhost:8000
  - phpMyAdmin: http://localhost:8080

Note: The service name is laravel_app (as defined in docker-compose.yml). Use laravel_app in docker-compose exec commands.

Backend (Laravel)
- Run tests
  - All tests
    - docker-compose exec laravel_app php artisan test
    - Or: docker-compose exec laravel_app composer test
  - Single test (by class or method)
    - docker-compose exec laravel_app php artisan test --filter AuthenticationTest
    - docker-compose exec laravel_app php artisan test --filter "RegistrationTest::test_user_can_register"
    - Alternative: docker-compose exec laravel_app ./vendor/bin/phpunit tests/Feature/AuthenticationTest.php --filter test_user_can_login
- Lint/format PHP (Laravel Pint)
  - docker-compose exec laravel_app ./vendor/bin/pint
  - Check mode: docker-compose exec laravel_app ./vendor/bin/pint --test
- Database migrations and seeders
  - docker-compose exec laravel_app php artisan migrate
  - docker-compose exec laravel_app php artisan db:seed
  - Reset: docker-compose exec laravel_app php artisan migrate:fresh --seed
- Queues (notifications, low stock, etc.)
  - In Docker, a dedicated worker is already defined (laravel_queue). For ad-hoc local runs:
    - docker-compose exec laravel_app php artisan queue:work database --queue=notifications,default
- GraphQL
  - Endpoint: http://localhost:8000/graphql
  - Protected by web + auth:sanctum middleware; the frontend includes credentials and relies on Sanctum cookies.

Frontend (React + Vite)
- Install deps and run dev server
  - cd frontend
  - npm ci
  - npm run dev -- --host
- Build and preview
  - npm run build
  - npm run preview
- Lint
  - npm run lint
  - Single file: npx eslint src/path/to/File.jsx
- Tests
  - Test files exist (e.g., src/components/Notifications/__tests__/NotificationsPage.test.jsx), but no test runner script is configured in package.json. If you introduce Vitest or Jest, add appropriate scripts before running tests.

Environment configuration
- Frontend expects these Vite env vars (examples reflect the Docker defaults):
  - VITE_API_URL=http://localhost:8000/api
  - VITE_BACKEND_URL=http://localhost:8000
  - VITE_BACKEND_GRAPHQL_URL=http://localhost:8000/graphql
- Backend .env keys for browser-based auth integration (already set in .env.example):
  - FRONTEND_URL=http://localhost:5173
  - SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
  - CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

High-level architecture (big picture)
- Backend (Laravel)
  - APIs
    - GraphQL: rebing/graphql-laravel, configured in backend/config/graphql.php
      - Route /graphql with batching enabled, restricted by web + auth:sanctum
      - Schemas define product, sales, purchases, and stock movement queries/mutations
      - Custom scalar Upload and unions; pagination types and meta
    - REST: routes in backend/routes/api.php under auth:sanctum
      - Dashboards, sales, purchases, inventory, notifications, reports, users, preferences
  - Domain structure (selected entry points)
    - app/Models: Eloquent models (Product, Sale, Purchase, StockMovement, User, etc.)
    - app/Services: Business logic and aggregations
      - AnalyticsService: dashboard metrics, financials, series, low stock analysis with caching
      - NotificationService: centralized notification creation, caching, and idempotency
    - app/Observers: Side-effect orchestration
      - PurchaseObserver, SaleItemObserver: maintain stock, create StockMovement, dispatch jobs, bump caches
    - app/Jobs: Background work on queues
      - CreatePurchaseNotificationJob, CreateSaleNotificationJob (queue: notifications)
      - CheckLowStockJob (periodic/triggered low-stock alerts)
    - app/Providers/AppServiceProvider: registers observers; customizes password reset URLs to FRONTEND_URL
    - database/migrations and seeders: schema and realistic test data
    - tests (phpunit.xml): Feature + Unit suites; in-memory sqlite for fast runs
    - app/Support/CacheHelper: unified cache key/ttl helpers used by services and observers
  - Runtime behavior (example flows)
    - Sale created → SaleItemObserver updates Product.stock and creates a StockMovement → enqueues CreateSaleNotificationJob → NotificationService writes notification → caches bumped for real-time UI updates
    - Purchase created → PurchaseObserver enqueues CreatePurchaseNotificationJob → caches bumped → AnalyticsService picks up changes via its cached dashboards

- Frontend (React + Vite)
  - Data access
    - Apollo Client (src/api/Apollo/ApolloClient.js) with UploadHttpLink, credentials: 'include'
      - Cache policies avoid merging paginated data incorrectly; keyArgs tuned for product queries
    - Axios (src/api/AxiosClient.jsx) for REST endpoints
      - Uses VITE_API_URL for /api routes and VITE_BACKEND_URL for CSRF cookie (Sanctum)
  - State and app structure
    - Contexts for auth, notifications, preferences; Redux Toolkit slice for users
    - Routes in src/router/Index.jsx; ProtectedRoute gates authenticated pages
    - Feature areas under src/pages (Dashboard, Admin/Products, Sales, Purchases, Inventory, Reports)
    - GraphQL operations organized by domain under src/GraphQL

Operational notes
- Sanctum + CORS
  - The app relies on cookie-based auth. Ensure FRONTEND_URL, SANCTUM_STATEFUL_DOMAINS, and CORS_ALLOWED_ORIGINS correspond to your frontend origin (Vite dev server by default).
- Queues
  - Docker runs dedicated queue workers (laravel_queue). Long-running features (notifications, low-stock checks) depend on these workers.

Repository guidance for Warp
- Prefer Docker workflows for consistency. Use laravel_app for backend execs and react_app for the frontend dev server.
- For backend changes, run Pint before committing and php artisan test for fast feedback; filter to a single test when iterating.
- Frontend linting is available; add a test runner (e.g., Vitest) if you intend to execute existing test files.

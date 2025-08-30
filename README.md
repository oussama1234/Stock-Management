# 🚀 Laravel + React + MySQL + phpMyAdmin (Docker Setup)

This project provides a **full-stack boilerplate** with Laravel (backend), React (frontend), MySQL, and phpMyAdmin using Docker & Docker Compose.

## 📦 Services
- **Laravel** → PHP backend (http://localhost:8000)
- **React (Dev)** → React with hot reload (http://localhost:3000)
- **React (Prod)** → React built & served by Nginx (http://localhost:8081)
- **MySQL** → Database (port 3306)
- **phpMyAdmin** → DB admin (http://localhost:8080)

## 🛠️ Getting Started
```bash
# Start all containers (dev mode)
docker-compose up --build

# Stop containers
docker-compose down

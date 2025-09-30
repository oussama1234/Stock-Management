# Stock Management System - Deployment Guide

This guide will help you deploy your Stock Management System with:
- **Frontend** (React/Vite) on **Vercel**
- **Backend** (Laravel/PHP) on **Render**

## Prerequisites

- GitHub account
- Vercel account
- Render account
- Your code pushed to a GitHub repository

## Part 1: Deploy Backend to Render

### Step 1: Create PostgreSQL Database on Render

1. Log into your [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `stock-management-db`
   - **Database**: `stock_db`
   - **User**: `laravel`
   - **Plan**: Free (or your preferred plan)
4. Click "Create Database"
5. **Save the connection details** (you'll need them later)

### Step 2: Deploy Laravel Backend

1. In Render Dashboard, click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `stock-management-backend`
   - **Runtime**: PHP
   - **Build Command**: 
     ```bash
     cd backend && composer install --optimize-autoloader --no-dev && php artisan config:cache && php artisan route:cache && php artisan view:cache
     ```
   - **Start Command**:
     ```bash
     cd backend && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
     ```
   - **Plan**: Free (or your preferred plan)

### Step 3: Configure Backend Environment Variables

In your Render service settings, add these environment variables:

```bash
# Basic App Configuration
APP_NAME="Stock Management"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:mD5rrDJhcMRP0fam+EHYxDe6V0bNRfy73D9/W/MDDDU=

# URLs (update these with your actual URLs)
APP_URL=https://your-render-service-name.onrender.com
FRONTEND_URL=https://your-vercel-app.vercel.app

# Database (use the values from your PostgreSQL database)
DB_CONNECTION=pgsql
DB_HOST=your-db-hostname
DB_PORT=5432
DB_DATABASE=stock_db
DB_USERNAME=laravel
DB_PASSWORD=your-db-password

# Caching and Sessions
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

# Logging
LOG_CHANNEL=stderr
LOG_LEVEL=info

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
CORS_SUPPORTS_CREDENTIALS=true

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=your-vercel-app.vercel.app
```

**Important Notes:**
- Replace `your-render-service-name` with your actual Render service name
- Replace `your-vercel-app` with your actual Vercel app name
- Use the database credentials from Step 1

### Step 4: Generate Application Key

After deployment, you need to generate a new Laravel application key:

1. Go to your Render service dashboard
2. Open the "Shell" tab
3. Run: `cd backend && php artisan key:generate --force`
4. Copy the generated key and update the `APP_KEY` environment variable

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend Environment

1. Create a `.env.production` file in the `frontend` directory:
```bash
VITE_API_URL=https://your-render-service-name.onrender.com/api
VITE_BACKEND_URL=https://your-render-service-name.onrender.com
VITE_BACKEND_GRAPHQL_URL=https://your-render-service-name.onrender.com/graphql
```

### Step 2: Deploy to Vercel

1. Log into [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

```bash
VITE_API_URL=https://your-render-service-name.onrender.com/api
VITE_BACKEND_URL=https://your-render-service-name.onrender.com
VITE_BACKEND_GRAPHQL_URL=https://your-render-service-name.onrender.com/graphql
```

### Step 4: Update Backend URLs

After Vercel deployment, update your backend environment variables with the actual Vercel URL:

1. Go to Render dashboard → Your backend service → Environment
2. Update these variables:
   - `FRONTEND_URL=https://your-actual-vercel-url.vercel.app`
   - `CORS_ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app`
   - `SANCTUM_STATEFUL_DOMAINS=your-actual-vercel-url.vercel.app`

## Part 3: Testing the Deployment

### Test Backend Health Check
Visit: `https://your-render-service-name.onrender.com/api/health`

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### Test Frontend
Visit your Vercel URL and verify:
- ✅ App loads correctly
- ✅ Authentication works
- ✅ API calls work
- ✅ GraphQL queries work

## Common Issues and Solutions

### Issue 1: CORS Errors
**Solution**: Make sure your Vercel URL is correctly added to:
- `FRONTEND_URL` in Render
- `CORS_ALLOWED_ORIGINS` in Render
- `SANCTUM_STATEFUL_DOMAINS` in Render

### Issue 2: Database Connection Failed
**Solution**: 
- Verify PostgreSQL database is running
- Check database credentials in environment variables
- Ensure database allows connections from Render

### Issue 3: 404 Errors on Frontend Routes
**Solution**: The `vercel.json` file should handle this automatically with SPA routing

### Issue 4: Build Failures
**Backend Build Issues**:
- Check PHP version compatibility
- Verify composer.json dependencies
- Check storage permissions

**Frontend Build Issues**:
- Verify all environment variables are set
- Check for TypeScript errors
- Ensure all dependencies are installed

## Environment URLs Structure

After successful deployment, your URLs will be:

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend API**: `https://your-service-name.onrender.com/api`
- **Backend GraphQL**: `https://your-service-name.onrender.com/graphql`
- **Health Check**: `https://your-service-name.onrender.com/api/health`

## Security Checklist

- ✅ `APP_DEBUG=false` in production
- ✅ Strong `APP_KEY` generated
- ✅ Database credentials secured
- ✅ CORS properly configured
- ✅ Environment variables not exposed in frontend
- ✅ HTTPS enabled on both platforms

## Maintenance

### Updating the Application
1. Push changes to your GitHub repository
2. Vercel will auto-deploy frontend changes
3. Render will auto-deploy backend changes (if auto-deploy is enabled)

### Database Migrations
Use Render Shell to run migrations:
```bash
cd backend && php artisan migrate --force
```

### Monitoring
- Use Render logs for backend monitoring
- Use Vercel functions logs for frontend monitoring
- Monitor the `/api/health` endpoint for uptime

---

## Need Help?

If you encounter issues during deployment, check:
1. Render service logs
2. Vercel deployment logs
3. Browser developer console for frontend errors
4. Database connection status

Remember to replace all placeholder URLs with your actual deployment URLs!
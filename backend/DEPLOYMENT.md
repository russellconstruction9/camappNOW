# Deployment Guide

## Supabase Connection Details

Your Supabase project is connected:
- **Project URL:** https://cqhocbnosmqaqmzpyguy.supabase.co
- **Anonymous Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxaG9jYm5vc21xYXFtenB5Z3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTM1NTQsImV4cCI6MjA3NzE4OTU1NH0.ZdMMyqvqcVQ2DkSQvIkcAY8EdFrKDcmbrLHHCSaQI_o

## Setting Up the Database Schema

1. **Open Supabase Dashboard:** Go to https://supabase.com/dashboard/project/cqhocbnosmqaqmzpyguy
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content from `src/db/schema.sql`**
4. **Click "Run" to execute the migration**

## Environment Variables for Vercel

Add these environment variables in your Vercel project settings:

### Required for Backend:
```bash
# Database (Supabase)
DB_HOST=db.cqhocbnosmqaqmzpyguy.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[Get from Supabase Settings -> Database]

# JWT
JWT_SECRET=[Generate a strong random string]
JWT_EXPIRES_IN=7d

# API Keys
GEMINI_API_KEY=[Your Gemini API key]
GOOGLE_MAPS_API_KEY=[Your Google Maps API key]

# CORS
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Server
PORT=3001
```

## Deploying to Vercel

### Option 1: Using Vercel CLI

```bash
cd backend
npm install -g vercel
vercel login
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your team/user)
# - Link to existing project? N
# - Project name? constructtrack-pro-backend
# - Directory? ./
# - Override settings? N
```

### Option 2: Using GitHub Integration

1. Push your code to GitHub
2. Go to vercel.com
3. Import your repository
4. Set root directory to `backend`
5. Configure environment variables
6. Deploy

## Getting Your Supabase Password

1. Go to Supabase Dashboard
2. Settings -> Database
3. Find "Connection string" section
4. The password is after `:` in the PostgreSQL connection string

## Testing the Deployment

1. Visit `https://your-backend.vercel.app/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. Test authentication:
   ```bash
   curl -X POST https://your-backend.vercel.app/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User",
       "role": "Installer",
       "hourlyRate": 25
     }'
   ```

## API Base URL

Your backend API will be available at:
- **Development:** http://localhost:3001
- **Production:** https://your-backend.vercel.app

All endpoints are prefixed with `/api/v1`


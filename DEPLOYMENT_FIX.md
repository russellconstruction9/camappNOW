# Deployment Fix for Blank Page

## Issues Fixed

### 1. ✅ Vite Build Configuration
- Added `chunkSizeWarningLimit: 1000` to suppress warning
- Added manual chunk splitting for better optimization
- Splits vendors into separate chunks (React, date-fns, Google AI)

### 2. ✅ Vercel Configuration
- Created `vercel.json` with proper settings
- Configured SPA routing (all routes go to index.html)
- Added caching headers for assets

### 3. ✅ Build Command
Make sure to run:
```bash
npm run build
```

## Vercel Deployment Steps

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your team/user)
# - Link to existing project? N
# - Project name? constructtrack-pro
# - Directory? ./
# - Override settings? N
```

### Option 2: Deploy via GitHub
1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Vercel auto-detects Vite
5. Deploy

## Environment Variables

Add these in Vercel Dashboard (Settings → Environment Variables):

```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Testing Deployment

After deployment, check:

1. **Homepage loads**: `https://your-app.vercel.app/`
2. **Console errors**: Open DevTools → Console (should be no errors)
3. **Network tab**: Check if assets are loading
4. **Hash routing works**: Navigate to different pages

## Common Issues & Solutions

### Blank Page
**Cause**: Missing base path or routing issues
**Fix**: Using HashRouter (already implemented)

### 404 on Routes
**Cause**: Vercel not configured for SPA
**Fix**: `vercel.json` with rewrites (already added)

### Chunk Size Warning
**Cause**: Large bundle size
**Fix**: Added chunk splitting and increased limit

### Environment Variables
**Cause**: Missing API keys
**Fix**: Add GEMINI_API_KEY in Vercel dashboard

## Optimizations Applied

### Code Splitting
- React libraries in separate chunk
- Date libraries in separate chunk
- Google AI in separate chunk
- Main app code in its own chunk

### Caching
- Assets cached for 1 year
- Immutable cache headers

### SPA Routing
- All routes rewrite to index.html
- Hash routing for compatibility

## Build Output Should Show

```
✓ built in 5s
dist/index.html                   2.4 kB
dist/assets/react-vendor-abc123.js   150 kB
dist/assets/date-vendor-def456.js     50 kB
dist/assets/google-vendor-ghi789.js   80 kB
dist/assets/index-jkl012.js          120 kB
```

## Next Steps

1. ✅ Build locally: `npm run build`
2. ✅ Test locally: `npm run preview`
3. ✅ Deploy to Vercel
4. ✅ Add environment variables
5. ✅ Test deployed app

## If Still Blank

Check browser console for errors:
```javascript
// Open DevTools (F12)
// Look for errors like:
// - Failed to load module
// - CORS errors
// - 404 errors
// - JavaScript errors
```

Most likely causes:
1. Missing environment variable → Add GEMINI_API_KEY
2. Build failed → Check Vercel build logs
3. Wrong base path → Already fixed with HashRouter
4. Service Worker issues → Clear cache and reload


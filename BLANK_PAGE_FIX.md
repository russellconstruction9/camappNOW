# Fixing Blank Page on Vercel

## The Issue
Your app uses CDN imports (importmap) but Vercel is trying to build it as a normal Vite app. This causes the blank page.

## What's Happening
- `index.html` uses CDN imports: `https://aistudiocdn.com/react@^19.2.0`
- Vercel sees `vite.config.ts` and tries to bundle everything
- CDN imports don't work with Vite bundling
- Result: Blank page

## Solution Options

### Option 1: Remove CDN Imports (Recommended for Vercel)

Since you have dependencies in `package.json`, let Vite bundle them properly:

**Step 1: Update index.html**
Remove the importmap and use bundled code:

```html
<!-- REMOVE THIS -->
<script type="importmap">
{
  "imports": {
    "react": "https://aistudiocdn.com/react@^19.2.0",
    ...
  }
}
</script>

<!-- The bundled code will work instead -->
```

**Step 2: Update build config**
Your `vite.config.ts` already has the fix.

**Step 3: Build and deploy**
```bash
npm run build
vercel --prod
```

### Option 2: Use Vercel's Static Hosting
If you want to keep CDN imports, don't use Vite build at all.

## Quick Fix - Do This Now

1. **Check Vercel Build Logs:**
   - Go to https://vercel.com/dashboard
   - Click on your deployment
   - Check "Build Logs" tab
   - Look for errors

2. **Common Errors:**
   - "Failed to resolve import 'react'"
   - "Cannot find module"
   - Build failed

3. **Immediate Fix:**
   
   Try building locally first:
   ```bash
   npm install
   npm run build
   npm run preview
   ```
   
   If that works locally but not on Vercel, the issue is configuration.

## Updated vercel.json

I've simplified your `vercel.json` to let Vite handle everything:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This tells Vercel:
- Build with `npm run build`
- Output to `dist/`
- Don't auto-detect framework (we handle it)
- Rewrite all routes to `index.html` for SPA

## After Fixing IDs:

1. **Commit and push:**
   ```bash
   git add vercel.json
   git commit -m "fix: simplify vercel config for vite build"
   git push origin main
   ```

2. **Vercel will auto-redeploy**

3. **Check browser console:**
   - Press F12 on your deployed site
   - Look at Console tab
   - Tell me what errors you see

## Debug Checklist

- [ ] Does `npm run build` work locally?
- [ ] Does `npm run preview` show the app correctly?
- [ ] Check Vercel build logs for errors
- [ ] Check browser console for JavaScript errors
- [ ] Verify environment variables are set in Vercel
- [ ] Check Network tab for failed asset loads

## If Still Blank

Share these with me:
1. Vercel build logs (screenshot or paste)
2. Browser console errors (F12 → Console)
3. Network tab - are assets loading? (F12 → Network)

Common issues:
- Missing environment variable (GEMINI_API_KEY)
- CDN import conflicts
- Build errors
- Wrong output directory


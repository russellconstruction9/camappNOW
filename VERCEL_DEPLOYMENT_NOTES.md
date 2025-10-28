# Vercel Deployment Notes

## Current Issue: Blank Page
- Build succeeds with no errors
- But screen is blank on deployment
- No framework was detected

## The Fix Applied

Changed `vercel.json` from:
```json
{
  "framework": null
}
```

To:
```json
{
  "framework": "vite"
}
```

This ensures Vercel properly detects and builds your Vite app.

## What Happens Now

After pushing this fix:
1. Vercel will detect framework as "vite"
2. Vercel will run `npm run build`
3. Output to `dist/` directory
4. Serve the built files with proper routing

## If Still Blank

Check browser console (F12):
1. Are there any red errors?
2. Are JavaScript files loading? (Network tab)
3. Is the HTML loading but React not rendering?

Common causes:
- Missing environment variable (GEMINI_API_KEY)
- Service worker caching old version
- Asset loading issues

## Quick Debug Steps

1. **Clear cache:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check Network tab:** Are all assets returning 200 OK?
3. **Check Console:** Any errors about missing modules?
4. **Disable service worker:** In DevTools → Application → Service Workers → Unregister

## Success Indicators

✅ App loads normally  
✅ Can see dashboard  
✅ No console errors  
✅ All assets load (Network tab shows 200s)


# Checking Runtime Logs for SDK Issue

## ✅ Build Status
- SDK package is in `package.json`: `@runwayml/sdk@^3.7.0` ✅
- Build warnings are non-blocking (just Next.js being cautious) ✅
- Build should have succeeded ✅

## 🔍 What to Check Next

The build logs you showed are **build-time warnings**, not runtime errors. To diagnose the `runway_video_id` issue, we need **runtime logs** from when a video is actually generated.

### Step 1: Generate a New Video

1. Go to your app: https://petgroove.app
2. Generate a new video
3. Watch the Vercel logs in real-time

### Step 2: Check Runtime Logs in Vercel

1. Go to Vercel Dashboard → Your Project → Logs
2. Make sure "Live" is enabled
3. Filter by route: `/api/videos/generate`
4. Generate a video and watch the logs

### Step 3: Look for These Log Messages

#### ✅ Good Signs (SDK is working):
```
[Video Generation] Starting generateVideoAsync for video <id>
[Video Generation] Calling Runway API for video <id>
[Runway API] generateVideo function called
[Runway API] Calling SDK imageToVideo.create()
[Runway API] Task created with ID: <runway-id>
[Video Generation] Successfully updated video <id> with runway_video_id: <runway-id>
```

#### ❌ Bad Signs (SDK is failing):
```
[Video Generation] Runway API call FAILED for video <id>
[Runway API] Exception: <error>
[Video Generation] CRITICAL: Runway API returned no ID
Cannot find module '@runwayml/sdk'
RUNWAY_API_KEY is not set
```

### Step 4: Check Environment Variables

Even though the SDK is installed, verify the API key is set in Vercel:

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `RUNWAY_API_KEY` is set
3. Verify it's set for **Production** environment (not just Preview)
4. **Redeploy** after adding/updating environment variables

### Step 5: Check Database

Verify the `runway_video_id` column exists:

1. Go to Supabase Dashboard → Table Editor → `videos` table
2. Check if `runway_video_id` column exists
3. If not, run the migration:
   ```sql
   ALTER TABLE public.videos
   ADD COLUMN runway_video_id TEXT;
   ```

## Common Issues

### Issue 1: No Runtime Logs Appearing
**Cause**: Async function might be killed before it runs
**Solution**: Check if Vercel serverless function is completing before async operation

### Issue 2: SDK Not Found Error
**Cause**: Package not installed in Vercel deployment
**Solution**: 
- Check build logs for `@runwayml/sdk` installation
- Redeploy to ensure package is installed

### Issue 3: API Key Not Set
**Cause**: Environment variable not set in Vercel
**Solution**: 
- Add `RUNWAY_API_KEY` in Vercel environment variables
- Redeploy after adding

### Issue 4: SDK Call Failing
**Cause**: Invalid API key or API error
**Solution**: 
- Check Runway API key is valid
- Check Runway account has credits
- Check runtime logs for specific error message

## What to Share

When checking runtime logs, please share:

1. **Any log messages starting with `[Video Generation]`**
2. **Any log messages starting with `[Runway API]`**
3. **Any error messages** (even if they seem unrelated)
4. **Whether you see the SDK being called** (`[Runway API] Calling SDK imageToVideo.create()`)

This will help us identify exactly where the process is failing.


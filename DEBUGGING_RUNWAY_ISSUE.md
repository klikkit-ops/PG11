# Debugging Runway Video Generation Issue

## Current Problem

Videos are stuck in "processing" status without a `runway_video_id`. This means:
- The video record is created ✅
- Status is set to "processing" ✅
- But the Runway API call is not completing or saving the `runway_video_id` ❌

## What to Check in Vercel Logs

### 1. Check if `generateVideoAsync` is being called

Look for these log messages:
```
[Video Generation] Starting generateVideoAsync for video <video-id>
[Video Generation] Image URL: <url>
[Video Generation] Prompt: <prompt>...
```

**If you DON'T see these logs:**
- The async function might not be starting
- Vercel might be killing the background process immediately

### 2. Check if Runway SDK is being called

Look for these log messages:
```
[Video Generation] Calling Runway API for video <video-id>
[Runway API] generateVideo function called
[Runway API] Calling SDK imageToVideo.create()
```

**If you DON'T see these logs:**
- The SDK call is not happening
- Check if `@runwayml/sdk` package is installed in Vercel
- Check if `RUNWAY_API_KEY` is set in Vercel environment variables

### 3. Check for SDK errors

Look for these error messages:
```
[Video Generation] Runway API call FAILED for video <video-id>
[Runway API] Exception: <error>
```

**Common SDK errors:**
- `RUNWAY_API_KEY is not set` → API key missing in Vercel
- `Authentication failed` → Invalid API key
- `Invalid request` → Wrong parameters (check ratio, model, etc.)
- `Network error` → Connection issue

### 4. Check if runway_video_id is being saved

Look for these log messages:
```
[Video Generation] Successfully updated video <video-id> with runway_video_id: <id>
[Video Generation] Updated record: { runway_video_id: <id> }
```

**If you DON'T see these logs:**
- The database update is failing
- Check Supabase connection
- Check if `runway_video_id` column exists in database

### 5. Check for async function errors

Look for these error messages:
```
[Video Generation] Error in async video generation for video <video-id>
[Video Generation] Exception in generateVideoAsync for video <video-id>
```

**If you see these:**
- The async function is running but encountering errors
- Check the full error details in the logs

## Common Issues and Solutions

### Issue 1: SDK Package Not Installed in Vercel

**Symptoms:**
- Error: `Cannot find module '@runwayml/sdk'`
- Error: `RunwayML is not defined`

**Solution:**
1. Make sure `package.json` includes `@runwayml/sdk`
2. Redeploy in Vercel (it should auto-install)
3. Check Vercel build logs for package installation

### Issue 2: API Key Not Set in Vercel

**Symptoms:**
- Error: `RUNWAY_API_KEY is not set`
- Error: `Authentication failed`

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `RUNWAY_API_KEY` with your API key
3. Make sure it's set for the correct environment (Production, Preview, Development)
4. Redeploy after adding

### Issue 3: Vercel Serverless Function Timeout

**Symptoms:**
- Async function starts but never completes
- No logs after "Starting generateVideoAsync"
- Function times out

**Solution:**
- Vercel serverless functions have a timeout (default 10s, max 60s with `maxDuration`)
- The async function might be killed before it completes
- Consider using a job queue (Inngest, Trigger.dev) or Vercel Cron

### Issue 4: Database Update Failing

**Symptoms:**
- SDK call succeeds but `runway_video_id` is not saved
- Error: `Failed to update video with Runway response`

**Solution:**
1. Check Supabase connection
2. Verify `runway_video_id` column exists (run migration if needed)
3. Check Supabase logs for errors

### Issue 5: SDK Call Failing Silently

**Symptoms:**
- No error logs but `runway_video_id` is not saved
- Status stuck in "processing"

**Solution:**
- Check Runway API key is valid
- Check Runway account has credits
- Check image URL is publicly accessible
- Verify SDK parameters (ratio, model, etc.)

## Step-by-Step Debugging

### Step 1: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by route: `/api/videos/generate`
3. Look for logs starting with `[Video Generation]` or `[Runway API]`
4. Check for any errors

### Step 2: Verify Environment Variables

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `RUNWAY_API_KEY` is set
3. Verify `RUNWAY_MODEL_ID` is set (or defaults to `gen4_turbo`)
4. Make sure they're set for the correct environment

### Step 3: Check Package Installation

1. Go to Vercel Dashboard → Project → Deployments
2. Click on the latest deployment
3. Check "Build Logs" for package installation
4. Look for `@runwayml/sdk` in the logs

### Step 4: Test SDK Locally

1. Run locally: `npm run dev`
2. Generate a video
3. Check local logs for SDK calls
4. If it works locally but not in Vercel, it's an environment issue

### Step 5: Check Database

1. Go to Supabase Dashboard → Table Editor → `videos` table
2. Check if `runway_video_id` column exists
3. If not, run the migration: `supabase/migrations/20241111000001_add_runway_video_id.sql`
4. Check if any videos have `runway_video_id` set

## Expected Log Flow

When working correctly, you should see this log sequence:

```
[Video Generation] Starting async video generation for video <id>
[Video Generation] Starting generateVideoAsync for video <id>
[Video Generation] Updating video <id> status to processing
[Video Generation] Calling Runway API for video <id>
[Runway API] generateVideo function called
[Runway API] Calling SDK imageToVideo.create()
[Runway API] Task created with ID: <runway-id>
[Runway API] Retrieving initial task status for ID: <runway-id>
[Video Generation] Runway API call SUCCESS for video <id>
[Video Generation] Updating video <id> with Runway response
[Video Generation] Successfully updated video <id> with runway_video_id: <runway-id>
```

## Next Steps

1. **Check Vercel logs** for the log messages above
2. **Verify environment variables** are set in Vercel
3. **Check package installation** in Vercel build logs
4. **Test locally** to see if SDK works
5. **Check database** for `runway_video_id` column

## If Still Not Working

If you've checked everything above and it's still not working:

1. **Share Vercel logs** - Copy the relevant log entries
2. **Check Runway account** - Verify you have credits and API access
3. **Test SDK directly** - Try calling the SDK in a simple script
4. **Consider job queue** - For production, use a proper job queue instead of background functions


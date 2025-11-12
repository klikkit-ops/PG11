# Fix for Video Generation Hanging Issue

## Problem
Videos are stuck in "processing" status without a `runway_video_id`, meaning the Runway API call is not completing or the ID is not being saved.

## Root Cause Analysis

Based on the Vercel logs showing:
- Videos are set to "processing" status ✅
- But no `runway_video_id` is found ❌
- No Runway API logs are appearing ❌

This suggests one of these issues:

### 1. Vercel Serverless Function Timeout
Vercel serverless functions can terminate when the HTTP response is sent. Fire-and-forget async operations might not complete if they take too long.

### 2. Missing Runway API Key
The `RUNWAY_API_KEY` environment variable might not be set in Vercel, causing the API call to fail immediately.

### 3. Wrong Runway API Endpoint/Format
The Runway API endpoint or request format might be incorrect, causing the API call to fail.

### 4. Async Function Not Completing
The async function might be crashing before it can call the Runway API or save the video ID.

## Immediate Fixes Applied

### 1. Enhanced Logging
Added comprehensive logging to track:
- When the async function starts
- Environment variable checks
- Runway API call initiation
- Runway API responses
- Any errors that occur

### 2. Environment Variable Validation
Added explicit checks and logging for Runway API configuration.

### 3. Better Error Handling
Improved error handling to ensure errors are logged and video status is updated to "failed" if something goes wrong.

## Next Steps to Debug

### Step 1: Check Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:
   - `RUNWAY_API_KEY` - Your Runway API key
   - `RUNWAY_MODEL_ID` - Should be `gen4_turbo`
   - `RUNWAY_BASE_URL` - Should be `https://api.runwayml.com/v1`

### Step 2: Check Vercel Logs
1. Generate a new video
2. Check Vercel logs for:
   - `[Video Generation] Starting async video generation`
   - `[Video Generation] Environment check` - This will show if the API key is set
   - `[Runway API] generateVideo function called`
   - `[Runway API] Environment variables check`
   - Any error messages

### Step 3: Check Database
Run this SQL query to see the video status and error messages:

```sql
SELECT 
    id,
    status,
    error_message,
    runway_video_id,
    created_at,
    updated_at
FROM videos
ORDER BY created_at DESC
LIMIT 5;
```

## Long-Term Solution: Use a Job Queue

For production, consider using a proper job queue system:

### Option 1: Vercel Background Functions
Use Vercel's background functions feature (if available) to ensure async operations complete.

### Option 2: External Job Queue
Use a service like:
- **Inngest** - Great for Next.js, free tier available
- **Trigger.dev** - Built for TypeScript/Next.js
- **BullMQ** - Self-hosted Redis-based queue
- **Vercel Cron + API Route** - Poll for pending videos and process them

### Option 3: Webhook-Based Approach
1. Create video record with status "queued"
2. Use a separate API endpoint that processes queued videos
3. Call this endpoint via Vercel Cron or an external service
4. This ensures the processing happens in a dedicated function with proper timeout handling

## Temporary Workaround

If you need a quick fix, you can:

1. **Poll for Processing Videos**: Create a Vercel Cron job that runs every minute and processes videos that are stuck in "processing" status without a `runway_video_id`.

2. **Manual Retry**: Add a retry mechanism that checks for videos without `runway_video_id` and retries the Runway API call.

3. **Synchronous Processing** (Not Recommended): Wait for the Runway API call to complete before returning the response. This will make the API slower but more reliable.

## Testing

After deploying the updated code with enhanced logging:

1. Generate a new video
2. Check Vercel logs immediately after generation
3. Look for the `[Video Generation]` and `[Runway API]` log entries
4. Check if the `runway_video_id` is being saved to the database
5. If errors occur, the logs will now show exactly where the failure happens

## Expected Log Flow

When working correctly, you should see:

```
[Video Generation] Starting async video generation for video xxx
[Video Generation] Environment check: { hasRunwayApiKey: true, ... }
[Video Generation] Starting generateVideoAsync for video xxx
[Video Generation] Updating video xxx status to processing
[Runway API] generateVideo function called
[Runway API] Environment variables check: { hasApiKey: true, ... }
[Runway API] Starting video generation request
[Runway API] Calling endpoint: https://api.runwayml.com/v1/image-to-video
[Runway API] Response status: 200 OK
[Runway API] Success response: { id: "...", status: "..." }
[Video Generation] Runway API response for video xxx: { id: "...", ... }
[Video Generation] Updating video xxx with Runway response
```

If any of these logs are missing, that's where the problem is.


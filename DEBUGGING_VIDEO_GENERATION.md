# Debugging Video Generation Issues

This guide helps you identify and fix video generation problems by checking the right logs.

## Where to Find Logs

### 1. Vercel Deployment Logs
- Go to: https://vercel.com/your-project/deployments
- Click on the latest deployment
- Click "Logs" tab
- Filter by route: `/api/videos/generate`

### 2. Vercel Function Logs (Runtime)
- Go to: https://vercel.com/your-project/deployments
- Click on the latest deployment
- Click "Logs" tab
- Look for entries with `[Video Generation]` prefix

## Key Log Messages to Look For

### Successful Flow:
```
[Video Generation] ===== STARTING VIDEO GENERATION FOR {videoId} =====
[Video Generation] Environment check: { hasRunComfyKey: true, hasRunwayKey: true, ... }
[Video Generation] === CALLING RUNCOMFY API ===
[Video Generation] === RUNCOMFY API CALL SUCCEEDED ===
[Video Generation] Successfully saved runcomfy request_id for video {videoId}
```

### RunComfy Failure with Runway Fallback:
```
[Video Generation] === RUNCOMFY API CALL FAILED ===
[Video Generation] === ATTEMPTING RUNWAY FALLBACK ===
[Video Generation] === RUNWAY FALLBACK SUCCEEDED ===
[Video Generation] ⚠️ Used Runway as fallback after RunComfy failure
```

### Complete Failure:
```
[Video Generation] === RUNCOMFY API CALL FAILED ===
[Video Generation] === NO FALLBACK AVAILABLE ===
OR
[Video Generation] === RUNWAY FALLBACK ALSO FAILED ===
```

## What to Check

### 1. **Environment Variables**
Look for this log:
```
[Video Generation] Environment check: { hasRunComfyKey: true/false, hasRunwayKey: true/false, ... }
```

**If `hasRunComfyKey: false`:**
- Check Vercel environment variables
- Ensure `RUNCOMFY_API_KEY` is set

**If `hasRunwayKey: false` and RunComfy fails:**
- No fallback available
- Set `RUNWAY_API_KEY` or `RUNWAYML_API_SECRET` for fallback

### 2. **Image Processing**
Look for:
```
[Video Generation] Processing image to 9:16 aspect ratio for video {videoId}
[Video Generation] Image processed to 9:16, new URL: ...
```

**If you see "Failed to process image to 9:16":**
- Check `BLOB_READ_WRITE_TOKEN` is set
- Check image URL is accessible
- Check sharp library is working

### 3. **API Call Errors**
Look for:
```
[Video Generation] === RUNCOMFY API CALL FAILED ===
[Video Generation] Error details: { error: "...", ... }
```

**Common errors:**
- `Service temporarily unavailable` → RunComfy is down, should fallback to Runway
- `Unauthorized` → API key is invalid
- `Invalid image URL` → Image processing failed
- `Request timeout` → API is slow or unresponsive

### 4. **Database Updates**
Look for:
```
[Video Generation] Successfully saved {provider} request_id for video {videoId}
```

**If you don't see this:**
- The API call might have failed before saving
- Check for errors above this log

### 5. **Status Checking**
Look for logs in `/api/videos/status`:
```
[RunComfy] Status response: { ... }
[RunComfy] Result response: { ... }
```

**If status is stuck:**
- Check if request_id is saved in database
- Check if status endpoint is being called
- Check if API is returning correct status

## Logs to Provide for Debugging

When reporting an issue, please provide:

1. **Video Generation Logs** (from `/api/videos/generate`):
   - All logs starting with `[Video Generation]`
   - Especially the "Environment check" log
   - Any error logs

2. **Status Check Logs** (from `/api/videos/status`):
   - All logs starting with `[RunComfy]` or `[Runway API]`
   - Status response logs
   - Result response logs

3. **Error Messages**:
   - Any error messages in the logs
   - HTTP status codes
   - Full error objects

4. **Database State**:
   - Video record from Supabase
   - Check `provider` field (should be 'runcomfy' or 'runway')
   - Check `runway_video_id` field (should have a request_id)
   - Check `status` field

5. **Environment Variables** (without revealing actual keys):
   - Which API keys are configured
   - `RUNCOMFY_API_KEY`: present/not present
   - `RUNWAY_API_KEY` or `RUNWAYML_API_SECRET`: present/not present
   - `BLOB_READ_WRITE_TOKEN`: present/not present

## Common Issues and Solutions

### Issue: Videos show as "Ready" but have no video URL
**Check:**
- Status endpoint logs for `[RunComfy] Result response`
- Look for `"status": "failed"` in result
- Check error message in result

### Issue: Videos stuck in "processing" or "queued"
**Check:**
- Is status endpoint being called? (look for `/api/videos/status` logs)
- Is request_id saved? (check database)
- What status is API returning? (check status logs)

### Issue: "Service temporarily unavailable"
**Solution:**
- Should automatically fallback to Runway
- Check if Runway API key is configured
- Check if fallback is being attempted (look for "ATTEMPTING RUNWAY FALLBACK" log)

### Issue: No logs at all
**Check:**
- Is the API endpoint being called?
- Check browser network tab for `/api/videos/generate` request
- Check Vercel function logs (not just deployment logs)

## Quick Debugging Steps

1. **Generate a new video**
2. **Immediately check Vercel logs** for `/api/videos/generate`
3. **Look for these key indicators:**
   - `===== STARTING VIDEO GENERATION` → Function started
   - `Environment check` → Shows which APIs are configured
   - `CALLING RUNCOMFY API` → Attempting primary provider
   - `RUNCOMFY API CALL SUCCEEDED` or `FAILED` → Primary result
   - `ATTEMPTING RUNWAY FALLBACK` → Fallback triggered
   - `Successfully saved` → Request ID saved to database

4. **Check status endpoint logs** after a few seconds:
   - Look for status polling logs
   - Check what status API is returning
   - Check if video URL is being extracted

5. **Check database:**
   - Verify `runway_video_id` is set
   - Verify `provider` is set correctly
   - Check `status` field

## Providing Logs

When sharing logs, please:
1. Copy the full log entries (not just error messages)
2. Include timestamps
3. Include the video ID
4. Redact any API keys or sensitive data
5. Include both generation and status check logs


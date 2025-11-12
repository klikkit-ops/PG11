# Runway API Troubleshooting Guide

## Problem: Video Stuck in "Processing" Status

If your video is stuck in "processing" status and credits were deducted but no Runway API call was made, here's how to diagnose and fix it.

## Step 1: Check Vercel Logs

1. Go to your Vercel Dashboard
2. Navigate to your project → **Deployments** → Latest deployment
3. Click on **Logs** tab
4. Look for logs with `[Video Generation]` or `[Runway API]` prefix
5. Check for any error messages

### What to Look For:

- `[Video Generation] Starting async video generation` - Confirms the async function started
- `[Runway API] Starting video generation request` - Confirms Runway API was called
- `[Runway API] Response status: 401` - Authentication error
- `[Runway API] Response status: 404` - Endpoint not found
- `[Runway API] Response status: 400` - Bad request (wrong format)
- `[Video Generation] Exception` - Error occurred

## Step 2: Check Video Status in Database

Run this SQL query in Supabase to see the actual video status and error message:

```sql
SELECT 
    id,
    status,
    error_message,
    runway_video_id,
    created_at,
    updated_at
FROM videos
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

## Step 3: Verify Runway API Configuration

### Check Environment Variables

Make sure these are set in **Vercel** (not just locally):

1. `RUNWAY_API_KEY` - Your Runway API key
2. `RUNWAY_MODEL_ID` - Should be `gen4_turbo` or similar
3. `RUNWAY_BASE_URL` - Should be `https://api.runwayml.com/v1`

### Verify API Key

1. Go to [Runway ML Dashboard](https://app.runwayml.com/)
2. Navigate to API settings
3. Verify your API key is valid and has credits
4. Check if the API key has the right permissions

## Step 4: Common Issues and Fixes

### Issue 1: Wrong API Endpoint

**Symptoms:**
- Logs show `404 Not Found`
- Error: "Runway API error: 404"

**Fix:**
The Runway API endpoint might be different. Check the [Runway API Documentation](https://docs.dev.runwayml.com/) for the correct endpoint.

Current implementation uses: `${RUNWAY_BASE_URL}/image-to-video`

Possible correct endpoints:
- `/v1/image-to-video`
- `/v1/video/generate`
- `/v1/gen4-turbo/image-to-video`

### Issue 2: Wrong Request Format

**Symptoms:**
- Logs show `400 Bad Request`
- Error: "Runway API error: 400"

**Fix:**
Runway API might expect:
- Image as base64 instead of URL
- Different field names
- Different request structure

Check the actual Runway API documentation for the correct request format.

### Issue 3: Authentication Error

**Symptoms:**
- Logs show `401 Unauthorized`
- Error: "Runway API error: 401"

**Fix:**
1. Verify `RUNWAY_API_KEY` is set in Vercel
2. Check if the API key is valid
3. Verify the API key hasn't expired
4. Check if the API key has the right permissions

### Issue 4: Image URL Not Accessible

**Symptoms:**
- Runway API accepts the request but fails to process
- Error about image not found

**Fix:**
1. Verify the image URL is publicly accessible
2. Check if Vercel Blob URLs are accessible
3. Ensure the image URL doesn't require authentication
4. Try uploading the image directly to Runway first

### Issue 5: Async Function Not Running

**Symptoms:**
- No logs from `[Video Generation]` or `[Runway API]`
- Video stuck in "queued" status

**Fix:**
1. Check if the async function is being called
2. Verify the function isn't timing out
3. Check Vercel function logs for any errors
4. Ensure the database update is working

## Step 5: Test Runway API Manually

You can test the Runway API directly using curl:

```bash
curl -X POST https://api.runwayml.com/v1/image-to-video \
  -H "Authorization: Bearer YOUR_RUNWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "https://your-image-url.com/image.jpg",
    "prompt": "A pet dancing the Macarena",
    "model": "gen4_turbo",
    "duration": 8
  }'
```

Replace:
- `YOUR_RUNWAY_API_KEY` with your actual API key
- `https://your-image-url.com/image.jpg` with a publicly accessible image URL

## Step 6: Check Runway API Documentation

The Runway API might have changed. Check the official documentation:

- [Runway API Documentation](https://docs.dev.runwayml.com/)
- [Runway API Reference](https://docs.dev.runwayml.com/reference/gen4-turbo-image-to-video)

## Step 7: Update Code Based on Actual API

Once you know the correct endpoint and format, update:

1. `lib/runway.ts` - Update the `generateVideo()` function
2. `lib/runway.ts` - Update the `checkVideoStatus()` function
3. Test with a real API call
4. Check the response format and update the mapping

## Step 8: Refund Credits (If Needed)

If credits were deducted but the video generation failed, you might want to refund the credit:

```sql
-- Refund credit to user
UPDATE credits
SET credits = credits + 1,
    updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';
```

## Getting Help

If you're still stuck:

1. Check Vercel logs for detailed error messages
2. Check Runway API documentation for correct format
3. Test the API manually with curl
4. Contact Runway support if the API isn't working
5. Check Runway status page for any outages

## Next Steps

After fixing the issue:

1. Test with a new video generation
2. Monitor the logs to ensure it's working
3. Verify credits are being used correctly
4. Check that videos are being generated successfully


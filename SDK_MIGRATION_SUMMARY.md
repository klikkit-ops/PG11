# Runway SDK Migration Summary

## ✅ What Changed

### 1. Installed Official Runway SDK
- **Package**: `@runwayml/sdk` (v3.7.0)
- **Benefits**: Type safety, correct API usage, built-in error handling

### 2. Replaced Manual API Calls
- **Before**: Manual `fetch()` calls with guessed endpoint/format
- **After**: Official SDK methods that handle everything correctly

### 3. Fixed API Implementation
- ✅ **Correct endpoint**: SDK uses the right endpoint automatically
- ✅ **Correct request format**: Uses `promptImage` and `promptText` as required
- ✅ **Required parameters**: Added `ratio: '1280:720'` (required for gen4_turbo)
- ✅ **Correct response parsing**: Extracts video URL from `task.output[0]`
- ✅ **Status mapping**: Properly maps SDK statuses (PENDING, RUNNING, SUCCEEDED, FAILED)

### 4. Improved Error Handling
- SDK provides better error messages
- Proper error types (TaskFailedError, etc.)
- Automatic retry logic built-in

## 🔧 Key Changes in Code

### Before (Manual API):
```typescript
const response = await fetch(`${RUNWAY_BASE_URL}/image-to-video`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RUNWAY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: request.imageUrl, // Wrong field name
    prompt: request.prompt,   // Wrong field name
    // Missing required 'ratio' parameter
  }),
});
```

### After (SDK):
```typescript
const client = new RunwayML({ apiKey: RUNWAY_API_KEY });
const task = await client.imageToVideo.create({
  model: 'gen4_turbo',
  promptImage: request.imageUrl, // Correct field name
  promptText: request.prompt,    // Correct field name
  ratio: '1280:720',             // Required parameter
  duration: 8,
});
```

## 📋 What You Need to Do

### 1. Verify Environment Variables in Vercel

Make sure `RUNWAY_API_KEY` is set in Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `RUNWAY_API_KEY` is set (or `RUNWAYML_API_SECRET` - both work)
3. Verify `RUNWAY_MODEL_ID` is set (defaults to `gen4_turbo` if not set)
4. **Note**: You no longer need `RUNWAY_BASE_URL` - the SDK handles it

### 2. Deploy and Test

1. The code is already pushed to GitHub
2. Vercel should auto-deploy (if enabled)
3. Or manually redeploy from Vercel dashboard

### 3. Test Video Generation

1. Generate a new video
2. Check Vercel logs for SDK logs
3. Verify `runway_video_id` is being saved
4. Verify status updates correctly
5. Verify video URL is saved when complete

## 🎯 Expected Results

### Logs You Should See:
```
[Runway API] generateVideo function called
[Runway API] Calling SDK imageToVideo.create()
[Runway API] Task created with ID: <task-id>
[Runway API] Retrieving initial task status for ID: <task-id>
[Runway API] Initial task status: { id: ..., status: 'PENDING', ... }
[Video Generation] Runway API response: { id: ..., status: 'queued', ... }
[Video Generation] Updating video with Runway response
```

### Database Updates:
- ✅ `runway_video_id` should be saved immediately
- ✅ Status should be 'queued' or 'processing' initially
- ✅ Status should update to 'succeeded' when video is ready
- ✅ `video_url` should be saved when status is 'succeeded'

## 🔍 Troubleshooting

### If videos still hang:

1. **Check Vercel logs** for SDK errors
2. **Verify API key** is set correctly in Vercel
3. **Check Runway account** has credits
4. **Verify image URL** is publicly accessible
5. **Check task status** in Runway dashboard (if available)

### Common Issues:

**Issue**: "No video ID found"
- **Cause**: SDK create() didn't return an ID
- **Fix**: Check API key and Runway account status

**Issue**: "Status stuck in queued"
- **Cause**: Task might be throttled or pending
- **Fix**: Status endpoint will poll and update automatically

**Issue**: "Video URL not found"
- **Cause**: Video generation not complete yet
- **Fix**: Wait for status to become 'succeeded', then URL will be available

## 📊 Status Flow

1. **Create task**: `client.imageToVideo.create()` → Returns task ID
2. **Initial status**: Usually `PENDING` or `RUNNING`
3. **Poll status**: `client.tasks.retrieve(taskId)` → Check status
4. **When complete**: Status becomes `SUCCEEDED`, `output[0]` contains video URL
5. **If failed**: Status becomes `FAILED`, `failure` contains error message

## 🚀 Next Steps

1. **Deploy**: Code is ready, just deploy to Vercel
2. **Test**: Generate a video and monitor the logs
3. **Verify**: Check that `runway_video_id` is saved and status updates
4. **Monitor**: Watch Vercel logs for any SDK errors
5. **Adjust**: If needed, adjust the `ratio` parameter based on your video preferences

## 📝 Notes

- **Ratio options**: '1280:720' (16:9), '720:1280' (9:16), '960:960' (1:1), etc.
- **Duration**: Default is 8 seconds, can be adjusted
- **Status polling**: Happens automatically via the status endpoint
- **Error handling**: SDK provides detailed error messages
- **Credits**: Make sure your Runway account has credits

## ✅ Benefits of Using SDK

1. ✅ **No more guessing** - SDK uses correct API format
2. ✅ **Type safety** - TypeScript types prevent errors
3. ✅ **Better errors** - Clear error messages from SDK
4. ✅ **Automatic updates** - SDK stays up to date with API changes
5. ✅ **Less code** - Simpler, cleaner implementation
6. ✅ **Official support** - Maintained by Runway team


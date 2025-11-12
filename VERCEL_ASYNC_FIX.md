# Vercel Serverless Async Function Fix

## The Problem

Videos were stuck in "processing" status without a `runway_video_id` because:

1. **Vercel serverless functions terminate when the response is sent**
   - When we returned the response immediately, Vercel killed the function
   - The background `generateVideoAsync` function was never executed
   - The Runway SDK call never happened
   - The `runway_video_id` was never saved

2. **Evidence from logs:**
   - 80+ calls to `/api/videos/status` showing "no runway_video_id found"
   - No logs from `/api/videos/generate` showing SDK calls
   - Status stuck in "processing" but no Runway task was created

## The Solution

**Call the Runway SDK synchronously before returning the response.**

### Before (Broken):
```typescript
// Start async operation - don't await it
generateVideoAsync(videoId, imageUrl, prompt, serviceSupabase).catch(...);

// Return immediately - Vercel kills the function here
return NextResponse.json({ videoId, status: "queued" });
// ❌ Async function is killed before it runs
```

### After (Fixed):
```typescript
// Call Runway SDK synchronously (await)
const videoResponse = await generateVideo({
  imageUrl,
  prompt,
  duration: 8,
});

// Save runway_video_id BEFORE returning
await serviceSupabase
  .from("videos")
  .update({
    runway_video_id: videoResponse.id, // ✅ Saved before function terminates
    status: videoResponse.status,
  })
  .eq("id", videoId);

// Now return - runway_video_id is safely saved
return NextResponse.json({ videoId, status: videoResponse.status });
```

## Key Changes

1. **Synchronous SDK call**: Call `generateVideo()` with `await` before returning
2. **Save runway_video_id immediately**: Update database with Runway video ID before response
3. **Remove background async**: No longer using `generateVideoAsync` in background
4. **Error handling**: If SDK call fails, update video status to "failed" before returning

## Why This Works

- **Vercel keeps the function alive** until all awaited operations complete
- **runway_video_id is saved** before the function terminates
- **Status endpoint can poll** using the saved `runway_video_id`
- **Video generation continues** on Runway's servers (we just created the task)

## Trade-offs

### Pros:
- ✅ `runway_video_id` is always saved
- ✅ Status endpoint can poll for completion
- ✅ Reliable and predictable behavior
- ✅ Better error handling

### Cons:
- ⚠️ Slightly longer response time (waiting for Runway API call)
- ⚠️ User waits for SDK call to complete (usually 1-2 seconds)
- ⚠️ Function timeout risk if Runway API is slow (mitigated by `maxDuration: 60`)

## Performance Impact

- **Before**: Response returned immediately (~100ms), but video generation never started
- **After**: Response returned after Runway API call (~1-2 seconds), but video generation actually starts

**This is acceptable because:**
- Runway API call is fast (usually < 2 seconds)
- User expects some delay for video generation
- Better UX: Video actually starts generating
- Status endpoint can track progress

## Testing

After deploying this fix:

1. **Generate a new video**
2. **Check logs** for:
   - `[Video Generation] Calling Runway API to create task`
   - `[Runway API] Calling SDK imageToVideo.create()`
   - `[Video Generation] Successfully saved runway_video_id`
3. **Check database** for `runway_video_id` in the videos table
4. **Check status endpoint** - should now find `runway_video_id` and poll for completion

## Future Improvements

For production at scale, consider:

1. **Job Queue**: Use Inngest, Trigger.dev, or Vercel Cron for background jobs
2. **Webhooks**: Use Runway webhooks to notify when video is complete
3. **Queue System**: Use a proper queue (Bull, BullMQ) for video generation
4. **Background Workers**: Use Vercel Background Functions or separate worker service

## Related Files

- `app/api/videos/generate/route.ts` - Main fix applied here
- `lib/runway.ts` - SDK integration (unchanged)
- `app/api/videos/status/route.ts` - Status polling (uses runway_video_id)


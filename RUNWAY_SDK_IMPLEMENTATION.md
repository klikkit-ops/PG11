# Implementing Runway SDK

## Why Use the SDK?

Based on your current issues (videos stuck, no runway_video_id), the SDK will solve:
- ✅ Correct API endpoint and format (no guessing)
- ✅ Proper authentication handling
- ✅ Built-in task polling
- ✅ Better error handling
- ✅ Type safety with TypeScript
- ✅ Official support and updates

## Installation

### Step 1: Install the SDK

```bash
npm install @runwayml/sdk
# or
bun add @runwayml/sdk
```

**Note**: Check the exact package name in the Runway SDK documentation. It might be:
- `@runwayml/sdk`
- `runwayml`
- `@runway/sdk`

### Step 2: Check SDK Documentation

Visit: https://docs.dev.runwayml.com/api-details/sdks/

Find:
- Exact package name
- Installation instructions
- Usage examples for image-to-video
- TypeScript types

## Implementation Steps

### Step 1: Update lib/runway.ts

Replace the manual API calls with SDK calls:

```typescript
import { Runway } from '@runwayml/sdk'; // Adjust import based on actual SDK

const runway = new Runway({
  apiKey: process.env.RUNWAY_API_KEY!,
});

export async function generateVideo(request: RunwayVideoRequest): Promise<RunwayVideoResponse> {
  try {
    // Use SDK method for image-to-video
    const task = await runway.imageToVideo({
      image: request.imageUrl,
      prompt: request.prompt,
      model: RUNWAY_MODEL_ID,
      duration: request.duration || 8,
    });

    return {
      id: task.id,
      status: task.status,
      videoUrl: task.output?.[0]?.url,
    };
  } catch (error) {
    // SDK handles errors properly
    throw error;
  }
}

export async function checkVideoStatus(videoId: string): Promise<RunwayVideoResponse> {
  try {
    // Use SDK method to get task status
    const task = await runway.getTask(videoId);
    
    return {
      id: task.id,
      status: task.status,
      videoUrl: task.output?.[0]?.url,
      error: task.error,
    };
  } catch (error) {
    throw error;
  }
}
```

### Step 2: Update package.json

Add the SDK dependency:

```json
{
  "dependencies": {
    "@runwayml/sdk": "^1.0.0" // Use actual version from docs
  }
}
```

### Step 3: Update Environment Variables

Make sure `RUNWAY_API_KEY` is set in Vercel (same as before).

## Benefits

### Before (Manual API Calls)
- ❌ Guessing endpoint format
- ❌ Manual response parsing
- ❌ Manual error handling
- ❌ No type safety
- ❌ Hard to maintain

### After (SDK)
- ✅ Correct API usage
- ✅ Automatic response parsing
- ✅ Built-in error handling
- ✅ Full type safety
- ✅ Easy to maintain
- ✅ Automatic updates

## Migration Plan

1. **Install SDK**: `npm install @runwayml/sdk`
2. **Check Docs**: Verify the exact SDK API from documentation
3. **Update Code**: Replace manual API calls with SDK methods
4. **Test**: Test with a real video generation
5. **Deploy**: Deploy and verify it works

## Next Steps

1. Check the Runway SDK documentation for the exact package name and API
2. Install the SDK
3. Update `lib/runway.ts` to use the SDK
4. Test the implementation
5. Deploy and verify

## Resources

- **SDK Documentation**: https://docs.dev.runwayml.com/api-details/sdks/
- **Using the API Guide**: https://docs.dev.runwayml.com/guides/using-the-api
- **GitHub Examples**: https://github.com/runwayml/learn


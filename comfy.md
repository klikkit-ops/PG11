# Integrating Wan 2.5 via RunComfy API

This guide outlines the steps to replace Runway API with Wan 2.5 via RunComfy in your PetGroove app.

## Overview

**RunComfy** is a hosted service that provides API access to various AI models, including Wan 2.5. Wan 2.5 offers:
- Photorealistic video generation
- Support for 480p, 720p, or 1080p resolution
- Longer video clips (up to 10 seconds)
- Audio-driven video generation (optional)
- Multilingual support
- More affordable and faster than some alternatives

**Reference:** [RunComfy Wan 2.5 Playground](https://www.runcomfy.com/playground/wan-ai/wan-2.5)

---

## Step 1: Get RunComfy API Access

1. **Sign up for RunComfy**
   - Go to https://www.runcomfy.com
   - Create an account or sign in
   - Navigate to the **API Keys** section (usually under **DEVELOPERS** → **API Keys**)

2. **Generate an API Key**
   - Create a new API key
   - Copy and securely store the API key
   - Note: You may get free trial credits upon sign-up

3. **Review API Documentation**
   - Check the **API Docs** section on RunComfy
   - Note the base URL for API requests (typically something like `https://api.runcomfy.com` or similar)
   - Understand rate limits and pricing

---

## Step 2: Understand Wan 2.5 API Parameters

Based on the [official RunComfy API documentation](https://www.runcomfy.com/playground/wan-ai/wan-2-5/api), Wan 2.5 image-to-video API accepts:

### Required Parameters:
- **`prompt`**: Text description (max 2000 characters)
- **`img_url`**: Image URL (jpg, jpeg, png, bmp, webp)
  - Image must be between 360px and 2000px (width and height)
  - Must be publicly accessible HTTPS URL

### Optional Parameters:
- **`audio_url`**: Audio file URL (wav, mp3, 3-30s duration, max 15MB) - for audio-driven generation
- **`duration`**: Video duration - integer enum: `5` or `10` seconds (default: 5)
- **`resolution`**: Output resolution - string enum: `"480P"`, `"720P"`, or `"1080P"` (default: "480P")
- **`negative_prompt`**: What to avoid in the video (string, default: "")

### API Endpoints:
- **Submit Request**: `POST https://model-api.runcomfy.net/v1/models/wan-ai/wan-2-5/image-to-video`
- **Check Status**: `GET https://model-api.runcomfy.net/v1/requests/{request_id}/status`
- **Get Results**: `GET https://model-api.runcomfy.net/v1/requests/{request_id}/result`
- **Cancel Request**: `POST https://model-api.runcomfy.net/v1/requests/{request_id}/cancel`

### Status Values:
- `"in_queue"` - Job is queued
- `"in_progress"` - Job is processing
- `"completed"` - Job completed successfully
- `"cancelled"` - Job was cancelled

### Response Format:
- Submit request returns `request_id` and URLs for status/result/cancel
- Result endpoint returns `output.video` (single video URL) or `output.videos` (array of video URLs)

---

## Step 3: Create RunComfy Integration File

Create a new file `lib/runcomfy.ts` (or modify `lib/runway.ts` to support both):

```typescript
/**
 * RunComfy API integration for Wan 2.5 image-to-video generation
 * 
 * Documentation: https://www.runcomfy.com/playground/wan-ai/wan-2.5
 * API Docs: https://www.runcomfy.com (check API Docs section)
 */

export interface RunComfyVideoRequest {
  imageUrl: string;
  prompt: string;
  duration?: 5 | 10; // Duration in seconds (5 or 10, default: 5)
  resolution?: '480P' | '720P' | '1080P'; // Uppercase enum values
  negativePrompt?: string;
  audioUrl?: string; // Optional audio file URL
}

export interface RunComfyVideoResponse {
  id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  videoUrl?: string;
  error?: string;
}

// Environment variables
const RUNCOMFY_API_KEY = process.env.RUNCOMFY_API_KEY;
const RUNCOMFY_BASE_URL = 'https://model-api.runcomfy.net';

/**
 * Generate a video from an image using RunComfy Wan 2.5 API
 * 
 * API Endpoint: POST https://model-api.runcomfy.net/v1/models/wan-ai/wan-2-5/image-to-video
 */
export async function generateVideo(request: RunComfyVideoRequest): Promise<RunComfyVideoResponse> {
  if (!RUNCOMFY_API_KEY) {
    throw new Error('RUNCOMFY_API_KEY is not set. Please configure it in your environment variables.');
  }

  // Ensure prompt is within limits (2000 characters max)
  const MAX_PROMPT_LENGTH = 2000;
  let promptText = request.prompt;
  if (promptText.length > MAX_PROMPT_LENGTH) {
    console.warn(`[RunComfy] Prompt is ${promptText.length} characters, truncating to ${MAX_PROMPT_LENGTH}`);
    promptText = promptText.substring(0, MAX_PROMPT_LENGTH);
  }

  try {
    // Submit generation request
    const createResponse = await fetch(
      `${RUNCOMFY_BASE_URL}/v1/models/wan-ai/wan-2-5/image-to-video`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RUNCOMFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          img_url: request.imageUrl, // Note: API uses 'img_url' not 'image'
          duration: request.duration || 5,
          resolution: request.resolution || '720P', // Note: uppercase values
          negative_prompt: request.negativePrompt || '',
          audio_url: request.audioUrl, // Optional
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[RunComfy] API error:', createResponse.status, errorText);
      throw new Error(`RunComfy API error: ${createResponse.status} - ${errorText}`);
    }

    const taskData = await createResponse.json();
    
    // Extract request_id from response
    // The API returns request_id and URLs for status/result/cancel
    const requestId = taskData.request_id || taskData.id;
    
    if (!requestId) {
      console.error('[RunComfy] Response:', JSON.stringify(taskData, null, 2));
      throw new Error('RunComfy API did not return a request_id');
    }

    console.log('[RunComfy] Task created with request_id:', requestId);

    // Check initial status
    const statusResponse = await checkVideoStatus(requestId);
    
    return {
      id: requestId,
      status: statusResponse.status,
      videoUrl: statusResponse.videoUrl,
      error: statusResponse.error,
    };
  } catch (error) {
    console.error('[RunComfy] Exception:', error);
    throw error instanceof Error ? error : new Error(`Unexpected error: ${String(error)}`);
  }
}

/**
 * Check the status of a video generation job
 * 
 * API Endpoint: GET https://model-api.runcomfy.net/v1/requests/{request_id}/status
 * Result Endpoint: GET https://model-api.runcomfy.net/v1/requests/{request_id}/result
 */
export async function checkVideoStatus(requestId: string): Promise<RunComfyVideoResponse> {
  if (!RUNCOMFY_API_KEY) {
    throw new Error('RUNCOMFY_API_KEY is not set');
  }

  if (!requestId) {
    throw new Error('Request ID is required to check status');
  }

  try {
    // First check status
    const statusResponse = await fetch(
      `${RUNCOMFY_BASE_URL}/v1/requests/${requestId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${RUNCOMFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`RunComfy API error: ${statusResponse.status} - ${errorText}`);
    }

    const statusData = await statusResponse.json();
    const runcomfyStatus = statusData.status || statusData.state;
    
    // Map RunComfy status to our internal format
    const status = mapRunComfyStatus(runcomfyStatus);

    // If completed, fetch the result to get the video URL
    let videoUrl: string | undefined;
    let error: string | undefined;

    if (status === 'succeeded') {
      const resultResponse = await fetch(
        `${RUNCOMFY_BASE_URL}/v1/requests/${requestId}/result`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RUNCOMFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        // Extract video URL from output.video or output.videos array
        if (resultData.output?.video) {
          videoUrl = resultData.output.video;
        } else if (resultData.output?.videos && resultData.output.videos.length > 0) {
          videoUrl = resultData.output.videos[0];
        }
      }
    } else if (status === 'failed') {
      // Try to get error from result endpoint
      try {
        const resultResponse = await fetch(
          `${RUNCOMFY_BASE_URL}/v1/requests/${requestId}/result`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${RUNCOMFY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          error = resultData.error || resultData.failure_reason || 'Generation failed';
        }
      } catch (e) {
        error = 'Generation failed';
      }
    }

    return {
      id: requestId,
      status,
      videoUrl,
      error,
    };
  } catch (error) {
    console.error('[RunComfy] Error checking video status:', error);
    throw error instanceof Error ? error : new Error(`Unexpected error: ${String(error)}`);
  }
}

/**
 * Map RunComfy API status to our internal status format
 * 
 * RunComfy statuses: "in_queue", "in_progress", "completed", "cancelled"
 * Our internal statuses: "queued", "processing", "succeeded", "failed"
 */
function mapRunComfyStatus(runcomfyStatus: string): 'queued' | 'processing' | 'succeeded' | 'failed' {
  const statusLower = (runcomfyStatus || '').toLowerCase();
  
  if (statusLower === 'completed') {
    return 'succeeded';
  }
  if (statusLower === 'cancelled') {
    return 'failed'; // Treat cancelled as failed
  }
  if (statusLower === 'in_progress') {
    return 'processing';
  }
  // "in_queue" or any unknown status -> 'queued'
  return 'queued';
}
```

---

## Step 4: Update Environment Variables

Add to your `.env.local` file:

```bash
# RunComfy API Configuration
RUNCOMFY_API_KEY=your-runcomfy-api-key-here
# Base URL is fixed: https://model-api.runcomfy.net
```

**Important:** Also update these in your Vercel project settings:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `RUNCOMFY_API_KEY` (the base URL is hardcoded in the implementation)

---

## Step 5: Update Video Generation Route

Modify `app/api/videos/generate/route.ts`:

1. **Update imports:**
   ```typescript
   // Change from:
   import { generateVideo, generateDancePrompt } from "@/lib/runway";
   
   // To:
   import { generateVideo, generateDancePrompt } from "@/lib/runcomfy";
   // OR keep generateDancePrompt from runway.ts if you want to keep OpenAI prompt enhancement
   ```

2. **Update provider in database:**
   ```typescript
   // Change line 83 from:
   provider: "runway",
   
   // To:
   provider: "runcomfy",
   ```

3. **Update video generation call** (if needed):
   ```typescript
   const videoResponse = await generateVideo({
     imageUrl,
     prompt,
     duration: 10, // 5 or 10 seconds (default: 5)
     resolution: '720P', // '480P', '720P', or '1080P' (note: uppercase)
     // negativePrompt: 'cartoon, animated, illustration', // Optional
   });
   ```

---

## Step 6: Update Status Checking

If you have a status checking endpoint (e.g., `app/api/videos/[id]/status/route.ts`), update it:

```typescript
// Change from:
import { checkVideoStatus } from "@/lib/runway";

// To:
import { checkVideoStatus } from "@/lib/runcomfy";
```

---

## Step 7: Update Database Schema (if needed)

If your `videos` table has a `provider` column, existing records will still show "runway". New records will show "runcomfy". You may want to:

1. Keep the `provider` field to track which service was used
2. Or migrate existing records if you're fully switching

---

## Step 8: Test the Integration

1. **Test locally:**
   ```bash
   npm run dev
   ```

2. **Test video generation:**
   - Upload a pet image
   - Select a dance style
   - Click generate
   - Check console logs for RunComfy API calls
   - Verify the video is generated successfully

3. **Check status polling:**
   - Ensure status updates are working
   - Verify video URL is saved correctly

---

## Step 9: Handle API Differences

### Key Differences from Runway:

1. **Prompt Length:**
   - Runway: 1000 characters max
   - RunComfy Wan 2.5: 2000 characters max ✅ (more flexible)

2. **Resolution:**
   - Runway: Fixed ratios (1280:720, etc.)
   - RunComfy: Named resolutions (480P, 720P, 1080P) ✅ (more intuitive, note: uppercase)

3. **Audio Support:**
   - Runway: Not available
   - RunComfy: Optional audio-driven generation ✅ (new feature)

4. **Response Format:**
   - May differ - adjust parsing based on actual API response

---

## Step 10: Update Documentation

Update any documentation files that reference Runway:
- `AI_GENERATION_FILES.md`
- `AI_FLOW_EXPLANATION.md`
- `IMPLEMENTATION.md`
- Any README files

---

## Troubleshooting

### Common Issues:

1. **"API key not found"**
   - Verify `RUNCOMFY_API_KEY` is set in environment variables
   - Check Vercel environment variables if deployed

2. **"Invalid endpoint"**
   - Base URL is hardcoded: `https://model-api.runcomfy.net`
   - Verify the endpoint path matches: `/v1/models/wan-ai/wan-2-5/image-to-video`
   - Check [official API documentation](https://www.runcomfy.com/playground/wan-ai/wan-2-5/api) for any updates

3. **"Status not updating"**
   - Verify the status endpoint URL format
   - Check status mapping function matches actual API responses
   - Review API response format in RunComfy docs

4. **"Video URL not found"**
   - Check the response structure from RunComfy API
   - Adjust `videoUrl` extraction logic based on actual response format

---

## Next Steps

1. **Get API Documentation:**
   - Visit RunComfy's API Docs section
   - Note exact endpoint URLs and request/response formats
   - Update the code examples above with actual API details

2. **Test Thoroughly:**
   - Test with different image sizes
   - Test with different prompts
   - Test status polling
   - Test error handling

3. **Monitor Usage:**
   - Track API usage and costs
   - Monitor generation times
   - Compare quality with previous Runway results

4. **Consider Features:**
   - Audio-driven generation (if applicable)
   - Negative prompts for better control
   - Different resolutions based on use case

---

## Resources

- [RunComfy Wan 2.5 Playground](https://www.runcomfy.com/playground/wan-ai/wan-2.5)
- RunComfy API Documentation (check the API Docs section on their website)
- [Wan 2.5 Features](https://www.runcomfy.com/playground/wan-ai/wan-2.5) - Review features and capabilities

---

## Notes

✅ **This guide uses the official API documentation** from [RunComfy's API docs](https://www.runcomfy.com/playground/wan-ai/wan-2-5/api). The implementation includes:
- Correct base URL: `https://model-api.runcomfy.net`
- Correct endpoints for submit, status, and result
- Correct request/response formats
- Proper status mapping
- Bearer token authentication

**Key API Details:**
- Request parameter is `img_url` (not `image`)
- Resolution values are uppercase: `"480P"`, `"720P"`, `"1080P"`
- Duration is integer enum: `5` or `10` (not 8)
- Status values: `"in_queue"`, `"in_progress"`, `"completed"`, `"cancelled"`
- Video URL is in `output.video` or `output.videos[0]` from result endpoint


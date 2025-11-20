/**
 * RunComfy API integration for Wan 2.5 image-to-video generation
 * 
 * Official API Documentation: https://www.runcomfy.com/playground/wan-ai/wan-2-5/api
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
          resolution: request.resolution || '480P', // Note: uppercase values
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
    
    // Log the raw status response for debugging
    console.log('[RunComfy] Status response:', {
      requestId,
      rawStatus: runcomfyStatus,
      fullResponse: JSON.stringify(statusData, null, 2),
    });
    
    // Map RunComfy status to our internal format
    const status = mapRunComfyStatus(runcomfyStatus);
    
    console.log('[RunComfy] Mapped status:', {
      requestId,
      rawStatus: runcomfyStatus,
      mappedStatus: status,
    });

    // If completed, fetch the result to get the video URL
    let videoUrl: string | undefined;
    let error: string | undefined;

    if (status === 'succeeded') {
      console.log('[RunComfy] Status is succeeded, fetching result...');
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
        
        // Log full result response for debugging
        console.log('[RunComfy] Result response:', {
          requestId,
          hasOutput: !!resultData.output,
          outputKeys: resultData.output ? Object.keys(resultData.output) : [],
          fullResult: JSON.stringify(resultData, null, 2),
        });
        
        // Extract video URL from output.video or output.videos array
        if (resultData.output?.video) {
          videoUrl = resultData.output.video;
          console.log('[RunComfy] Found video URL in output.video:', videoUrl?.substring(0, 100));
        } else if (resultData.output?.videos && resultData.output.videos.length > 0) {
          videoUrl = resultData.output.videos[0];
          console.log('[RunComfy] Found video URL in output.videos[0]:', videoUrl?.substring(0, 100));
        } else {
          // Check for other possible video URL locations
          if (resultData.video) {
            videoUrl = resultData.video;
            console.log('[RunComfy] Found video URL in resultData.video:', videoUrl?.substring(0, 100));
          } else if (resultData.video_url) {
            videoUrl = resultData.video_url;
            console.log('[RunComfy] Found video URL in resultData.video_url:', videoUrl?.substring(0, 100));
          } else {
            console.warn('[RunComfy] No video URL found in result. Available keys:', Object.keys(resultData));
          }
        }
        
        // Log video metadata for debugging
        console.log('[RunComfy] Video result metadata:', {
          hasVideo: !!videoUrl,
          outputKeys: resultData.output ? Object.keys(resultData.output) : [],
          videoUrl: videoUrl?.substring(0, 100),
        });
      } else {
        console.error('[RunComfy] Result endpoint returned error:', resultResponse.status, await resultResponse.text());
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


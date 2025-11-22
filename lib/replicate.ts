/**
 * Replicate API integration for Seedance 1 Pro Fast image-to-video generation
 * 
 * Official API Documentation: https://replicate.com/bytedance/seedance-1-pro-fast/api
 * Replicate API Docs: https://replicate.com/docs/reference/http
 */

export interface ReplicateVideoRequest {
  imageUrl: string;
  prompt: string;
  numFrames?: number; // Number of frames (for models that use frames)
  duration?: number; // Duration in seconds (for Seedance models)
  resolution?: '480p' | '720p' | '1080p'; // Resolution options
  aspectRatio?: '9:16' | '16:9' | '1:1'; // Aspect ratio (default: 9:16)
  negativePrompt?: string;
  audioUrl?: string; // Optional audio file URL
}

export interface ReplicateVideoResponse {
  id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  videoUrl?: string;
  error?: string;
}

// Environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_BASE_URL = 'https://api.replicate.com/v1';
// Replicate model identifier
const MODEL_OWNER = 'bytedance';
const MODEL_NAME = 'seedance-1-pro-fast';

/**
 * Generate a video from an image using Replicate Seedance 1 Pro Fast API
 * 
 * API Endpoint: POST https://api.replicate.com/v1/predictions
 */
export async function generateVideo(request: ReplicateVideoRequest): Promise<ReplicateVideoResponse> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not set. Please configure it in your environment variables.');
  }

  // Ensure prompt is within limits (Replicate doesn't have a strict limit, but keep reasonable)
  const MAX_PROMPT_LENGTH = 2000;
  let promptText = request.prompt;
  if (promptText.length > MAX_PROMPT_LENGTH) {
    console.warn(`[Replicate] Prompt is ${promptText.length} characters, truncating to ${MAX_PROMPT_LENGTH}`);
    promptText = promptText.substring(0, MAX_PROMPT_LENGTH);
  }

  try {
    // First, get the latest version hash for the model
    // Replicate API requires a version hash, not a model identifier
    console.log('[Replicate] Fetching latest version for model...');
    const modelResponse = await fetch(
      `${REPLICATE_BASE_URL}/models/${MODEL_OWNER}/${MODEL_NAME}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!modelResponse.ok) {
      const errorText = await modelResponse.text();
      console.error('[Replicate] Error fetching model:', modelResponse.status, errorText);
      throw new Error(`Replicate API error fetching model: ${modelResponse.status} - ${errorText}`);
    }

    const modelData = await modelResponse.json();
    const versionHash = modelData.latest_version?.id;
    
    if (!versionHash) {
      console.error('[Replicate] No version hash found in model response:', JSON.stringify(modelData, null, 2));
      throw new Error('Replicate API did not return a version hash');
    }

    console.log('[Replicate] Using version hash:', versionHash);

    // Build input object for Replicate API
    const input: Record<string, any> = {
      image: request.imageUrl,
      prompt: promptText,
    };

    // Add optional parameters
    if (request.duration) {
      input.duration = request.duration; // Duration in seconds (for Seedance models)
    }
    if (request.numFrames) {
      input.num_frames = request.numFrames; // For models that use frames
    }
    if (request.resolution) {
      input.resolution = request.resolution;
    }
    if (request.aspectRatio) {
      input.aspect_ratio = request.aspectRatio;
    }
    if (request.negativePrompt) {
      input.negative_prompt = request.negativePrompt;
    }
    // Note: Seedance 1 Pro Fast does not support audio input
    // Audio must be added separately during post-production if needed
    // if (request.audioUrl) {
    //   input.audio = request.audioUrl;
    // }

    // Submit generation request
    console.log('[Replicate] Creating prediction with input:', {
      image: request.imageUrl.substring(0, 100) + '...',
      promptLength: promptText.length,
      duration: input.duration,
      numFrames: input.num_frames,
      resolution: input.resolution,
      aspectRatio: input.aspect_ratio,
      hasAudio: !!input.audio,
    });

    // Replicate API: POST /v1/predictions
    // Must use 'version' field with version hash (not 'model' field)
    const createResponse = await fetch(
      `${REPLICATE_BASE_URL}/predictions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: versionHash, // Use 'version' field with version hash (required)
          input: input,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[Replicate] API error:', createResponse.status, errorText);
      throw new Error(`Replicate API error: ${createResponse.status} - ${errorText}`);
    }

    const predictionData = await createResponse.json();
    
    // Log the full response for debugging
    console.log('[Replicate] POST response:', JSON.stringify(predictionData, null, 2));
    
    // Extract prediction ID from response
    const predictionId = predictionData.id;
    
    if (!predictionId) {
      console.error('[Replicate] No prediction ID found in response. Full response:', JSON.stringify(predictionData, null, 2));
      throw new Error('Replicate API did not return a prediction ID');
    }

    console.log('[Replicate] Prediction created successfully with ID:', predictionId);
    console.log('[Replicate] Initial status:', predictionData.status);

    // Map Replicate status to our internal format
    const status = mapReplicateStatus(predictionData.status);

    // Extract video URL if already available (unlikely but possible)
    let videoUrl: string | undefined;
    if (predictionData.output && Array.isArray(predictionData.output) && predictionData.output.length > 0) {
      videoUrl = predictionData.output[0];
    } else if (predictionData.output && typeof predictionData.output === 'string') {
      videoUrl = predictionData.output;
    }

    // Extract error if present
    let error: string | undefined;
    if (predictionData.error) {
      error = predictionData.error;
    }

    return {
      id: predictionId,
      status: status,
      videoUrl: videoUrl,
      error: error,
    };
  } catch (error) {
    console.error('[Replicate] Exception:', error);
    throw error instanceof Error ? error : new Error(`Unexpected error: ${String(error)}`);
  }
}

/**
 * Check the status of a video generation job
 * 
 * API Endpoint: GET https://api.replicate.com/v1/predictions/{id}
 */
export async function checkVideoStatus(predictionId: string): Promise<ReplicateVideoResponse> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not set');
  }

  if (!predictionId) {
    throw new Error('Prediction ID is required to check status');
  }

  try {
    const statusResponse = await fetch(
      `${REPLICATE_BASE_URL}/predictions/${predictionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Replicate API error: ${statusResponse.status} - ${errorText}`);
    }

    const predictionData = await statusResponse.json();
    
    // Log the full response for debugging
    console.log('[Replicate] Status response:', {
      predictionId,
      rawStatus: predictionData.status,
      hasOutput: !!predictionData.output,
      hasError: !!predictionData.error,
      fullResponse: JSON.stringify(predictionData, null, 2),
    });
    
    // Map Replicate status to our internal format
    const status = mapReplicateStatus(predictionData.status);
    
    console.log('[Replicate] Mapped status:', {
      predictionId,
      rawStatus: predictionData.status,
      mappedStatus: status,
    });

    // Extract video URL from output
    let videoUrl: string | undefined;
    if (status === 'succeeded') {
      if (predictionData.output) {
        // Output can be a string (single video URL) or array of strings
        if (Array.isArray(predictionData.output) && predictionData.output.length > 0) {
          videoUrl = predictionData.output[0];
          console.log('[Replicate] Found video URL in output array[0]:', videoUrl?.substring(0, 100));
        } else if (typeof predictionData.output === 'string') {
          videoUrl = predictionData.output;
          console.log('[Replicate] Found video URL in output string:', videoUrl?.substring(0, 100));
        } else {
          console.warn('[Replicate] Output is not a string or array:', typeof predictionData.output);
        }
      } else {
        console.warn('[Replicate] No output found in prediction data');
      }
    }

    // Extract error if present
    let error: string | undefined;
    if (predictionData.error) {
      error = predictionData.error;
      console.log('[Replicate] Error from prediction:', error);
    }

    // Log final metadata for debugging
    console.log('[Replicate] Final prediction metadata:', {
      status,
      hasVideo: !!videoUrl,
      videoUrl: videoUrl?.substring(0, 100),
      error,
    });

    return {
      id: predictionId,
      status: status,
      videoUrl: videoUrl,
      error: error,
    };
  } catch (error) {
    console.error('[Replicate] Error checking video status:', error);
    throw error instanceof Error ? error : new Error(`Unexpected error: ${String(error)}`);
  }
}

/**
 * Map Replicate API status to our internal status format
 * 
 * Replicate statuses: "starting", "processing", "succeeded", "failed", "canceled"
 * Our internal statuses: "queued", "processing", "succeeded", "failed"
 */
function mapReplicateStatus(replicateStatus: string): 'queued' | 'processing' | 'succeeded' | 'failed' {
  const statusLower = (replicateStatus || '').toLowerCase();
  
  if (statusLower === 'succeeded') {
    return 'succeeded';
  }
  if (statusLower === 'failed' || statusLower === 'canceled') {
    return 'failed';
  }
  if (statusLower === 'processing') {
    return 'processing';
  }
  // "starting" or any unknown status -> 'queued'
  return 'queued';
}


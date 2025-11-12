/**
 * Runway API integration for image-to-video generation
 * 
 * TODO: Replace with actual Runway API endpoints and authentication
 * Documentation: https://docs.runwayml.com/
 * 
 * Environment variables required:
 * - RUNWAY_API_KEY: Your Runway API key
 * - RUNWAY_MODEL_ID: Model ID (e.g. 'gen4_turbo')
 * - RUNWAY_BASE_URL: Base URL for Runway API (e.g. 'https://api.runwayml.com/v1')
 */

export interface RunwayVideoRequest {
  imageUrl: string;
  prompt: string;
  duration?: number; // Duration in seconds (5-10)
}

export interface RunwayVideoResponse {
  id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  videoUrl?: string;
  error?: string;
}

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const RUNWAY_MODEL_ID = process.env.RUNWAY_MODEL_ID || 'gen4_turbo';
const RUNWAY_BASE_URL = process.env.RUNWAY_BASE_URL || 'https://api.runwayml.com/v1';

/**
 * Generate a video from an image using Runway API
 * 
 * Note: This implementation is based on common API patterns.
 * You may need to adjust the endpoint, request format, or response parsing
 * based on the actual Runway API documentation.
 */
export async function generateVideo(request: RunwayVideoRequest): Promise<RunwayVideoResponse> {
  console.log('[Runway API] generateVideo function called');
  console.log('[Runway API] Environment variables check:', {
    hasApiKey: !!RUNWAY_API_KEY,
    apiKeyPrefix: RUNWAY_API_KEY ? RUNWAY_API_KEY.substring(0, 10) + '...' : 'MISSING',
    baseUrl: RUNWAY_BASE_URL,
    modelId: RUNWAY_MODEL_ID,
  });
  
  if (!RUNWAY_API_KEY) {
    const error = 'RUNWAY_API_KEY is not set. Please configure it in your environment variables.';
    console.error('[Runway API]', error);
    throw new Error(error);
  }

  console.log('[Runway API] Starting video generation request');
  console.log('[Runway API] Config:', {
    baseUrl: RUNWAY_BASE_URL,
    modelId: RUNWAY_MODEL_ID,
    hasApiKey: !!RUNWAY_API_KEY,
    imageUrl: request.imageUrl?.substring(0, 100) + '...',
    promptLength: request.prompt.length,
    duration: request.duration || 8,
  });

  try {
    // Runway API v1 uses /v1/image-to-video endpoint
    // Documentation: https://docs.dev.runwayml.com/reference/gen4-turbo-image-to-video
    const endpoint = `${RUNWAY_BASE_URL}/image-to-video`;
    
    console.log(`[Runway API] Calling endpoint: ${endpoint}`);
    
    const requestBody = {
      image: request.imageUrl, // Runway expects 'image' not 'imageUrl'
      prompt: request.prompt,
      model: RUNWAY_MODEL_ID,
      duration: request.duration || 8,
      // Additional parameters that might be needed:
      // seed: optional seed for reproducibility
      // ratio: optional aspect ratio (e.g., "16:9", "9:16", "1:1")
    };
    
    console.log('[Runway API] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[Runway API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Runway API] Error response:`, errorText);
      
      let errorMessage = `Runway API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error?.message || errorData.error || errorMessage;
        console.error(`[Runway API] Parsed error:`, errorData);
      } catch {
        errorMessage = `${errorMessage}. Response: ${errorText.substring(0, 500)}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[Runway API] Success response:', JSON.stringify(data, null, 2));
    
    // Map Runway API response to our expected format
    // Runway API typically returns: { id, status, output: [{ url }] }
    const runwayVideoId = data.id || data.videoId || data.taskId || data.jobId || '';
    const runwayStatus = data.status || data.state || 'queued';
    const videoUrl = data.output?.[0]?.url || data.videoUrl || data.video_url || data.url || undefined;
    const error = data.error?.message || data.error || data.error_message || undefined;
    
    console.log('[Runway API] Mapped response:', {
      id: runwayVideoId,
      status: runwayStatus,
      hasVideoUrl: !!videoUrl,
      error,
    });
    
    return {
      id: runwayVideoId,
      status: mapRunwayStatus(runwayStatus),
      videoUrl: videoUrl,
      error: error,
    };
  } catch (error) {
    console.error('[Runway API] Exception:', error);
    
    if (error instanceof Error) {
      // If it's a network error or the endpoint doesn't exist, provide helpful guidance
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        throw new Error(
          `Failed to connect to Runway API at ${RUNWAY_BASE_URL}. ` +
          `Please verify the RUNWAY_BASE_URL is correct and the API is accessible. ` +
          `Error: ${error.message}`
        );
      }
      throw error;
    }
    throw new Error(`Unexpected error calling Runway API: ${String(error)}`);
  }
}

/**
 * Map Runway API status to our internal status format
 */
function mapRunwayStatus(runwayStatus: string): 'queued' | 'processing' | 'succeeded' | 'failed' {
  const statusLower = runwayStatus.toLowerCase();
  if (statusLower === 'succeeded' || statusLower === 'completed' || statusLower === 'done') {
    return 'succeeded';
  }
  if (statusLower === 'failed' || statusLower === 'error') {
    return 'failed';
  }
  if (statusLower === 'processing' || statusLower === 'running' || statusLower === 'in_progress') {
    return 'processing';
  }
  return 'queued';
}

/**
 * Check the status of a video generation job
 * 
 * Note: This implementation is based on common API patterns.
 * You may need to adjust the endpoint or response parsing based on actual Runway API documentation.
 */
export async function checkVideoStatus(videoId: string): Promise<RunwayVideoResponse> {
  if (!RUNWAY_API_KEY) {
    throw new Error('RUNWAY_API_KEY is not set');
  }

  if (!videoId) {
    throw new Error('Video ID is required to check status');
  }

  try {
    // Common Runway API pattern: GET /v1/video/{videoId} or /v1/image-to-video/{videoId}
    // Adjust the endpoint based on actual Runway API documentation
    const endpoint = `${RUNWAY_BASE_URL}/image-to-video/${videoId}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Runway API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = `${errorMessage}. Response: ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Map Runway API response to our expected format
    return {
      id: data.id || data.videoId || data.taskId || data.jobId || videoId,
      status: mapRunwayStatus(data.status || data.state || 'queued'),
      videoUrl: data.videoUrl || data.video_url || data.output?.[0] || data.url || undefined,
      error: data.error || data.error_message || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        throw new Error(
          `Failed to connect to Runway API at ${RUNWAY_BASE_URL}. ` +
          `Please verify the RUNWAY_BASE_URL is correct. ` +
          `Error: ${error.message}`
        );
      }
      throw error;
    }
    throw new Error(`Unexpected error checking Runway API status: ${String(error)}`);
  }
}

/**
 * Generate a dance prompt based on dance style and pet characteristics
 * Uses OpenAI GPT-4 mini to create an optimized prompt for the video model
 */
export async function generateDancePrompt(
  danceStyle: string,
  petDescription?: string
): Promise<string> {
  // TODO: Implement OpenAI GPT-4 mini integration for prompt generation
  // This will help create more accurate and descriptive prompts for the video model
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    // Fallback to a simple template if OpenAI is not configured
    return `A pet ${petDescription ? `(${petDescription})` : ''} performing the ${danceStyle} dance style. The pet's face and identity are clearly preserved. The dance movements are smooth and natural, matching the ${danceStyle} style. Professional video quality, well-lit, stable camera.`;
  }

  // TODO: Implement OpenAI API call
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a prompt engineer specialized in creating detailed prompts for AI video generation. Create prompts that clearly describe dance movements while preserving the subject\'s identity.',
        },
        {
          role: 'user',
          content: `Create a detailed prompt for an image-to-video AI model that will make a pet ${petDescription ? `(${petDescription})` : ''} perform the ${danceStyle} dance. The prompt should preserve the pet's face and identity while clearly describing the dance movements.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
  */

  // Fallback prompt template
  const styleDescriptions: Record<string, string> = {
    macarena: 'performing the Macarena with coordinated arm movements and hip sways',
    salsa: 'dancing salsa with smooth, rhythmic movements and graceful turns',
    'hip hop': 'performing hip hop dance with energetic moves and sharp transitions',
    robot: 'doing the robot dance with mechanical, staccato movements',
    ballet: 'performing ballet with elegant, graceful movements and poise',
    disco: 'dancing disco with groovy moves and funky style',
    breakdance: 'breakdancing with spins, freezes, and dynamic floor movements',
    waltz: 'waltzing with smooth, flowing movements in 3/4 time',
    tango: 'dancing the tango with dramatic, passionate movements',
    cha_cha: 'performing the cha-cha with quick, rhythmic steps',
  };

  const styleDescription = styleDescriptions[danceStyle.toLowerCase()] || `dancing in the ${danceStyle} style`;
  
  return `A pet ${petDescription ? `(${petDescription})` : ''} ${styleDescription}. The pet's face, features, and identity are clearly preserved throughout the video. The dance movements are smooth, natural, and match the ${danceStyle} style accurately. Professional video quality, well-lit environment, stable camera, 8-10 second duration.`;
}


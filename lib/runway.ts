/**
 * Runway API integration for image-to-video generation
 * 
 * Uses the official RunwayML SDK for reliable API integration
 * Documentation: https://docs.dev.runwayml.com/api/
 * SDK Documentation: https://docs.dev.runwayml.com/api-details/sdks/
 * 
 * Environment variables required:
 * - RUNWAY_API_KEY: Your Runway API key (or RUNWAYML_API_SECRET - SDK supports both)
 * - RUNWAY_MODEL_ID: Model ID (e.g. 'gen4_turbo') - defaults to 'gen4_turbo'
 * 
 * Note: The SDK defaults to RUNWAYML_API_SECRET, but we support RUNWAY_API_KEY as well
 */

import RunwayML from '@runwayml/sdk';

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

// Environment variables
// Note: The SDK defaults to RUNWAYML_API_SECRET, but we use RUNWAY_API_KEY for consistency
// We pass it explicitly to the SDK, so either name will work
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || process.env.RUNWAYML_API_SECRET;
const RUNWAY_MODEL_ID = process.env.RUNWAY_MODEL_ID || 'gen4_turbo';

// Initialize Runway client
// The SDK defaults to RUNWAYML_API_SECRET from environment variables
// But we pass apiKey explicitly to support RUNWAY_API_KEY as well
const getRunwayClient = () => {
  if (!RUNWAY_API_KEY) {
    throw new Error(
      'RUNWAY_API_KEY or RUNWAYML_API_SECRET is not set. ' +
      'Please configure it in your environment variables.'
    );
  }
  // Pass API key explicitly to the SDK
  // The SDK will handle base URL and authentication automatically
  return new RunwayML({ apiKey: RUNWAY_API_KEY });
};

/**
 * Generate a video from an image using Runway API SDK
 * 
 * Uses the official RunwayML SDK for reliable API integration
 * Documentation: https://docs.dev.runwayml.com/api/
 */
export async function generateVideo(request: RunwayVideoRequest): Promise<RunwayVideoResponse> {
  console.log('[Runway API] generateVideo function called');
  console.log('[Runway API] Environment variables check:', {
    hasApiKey: !!RUNWAY_API_KEY,
    apiKeyPrefix: RUNWAY_API_KEY ? RUNWAY_API_KEY.substring(0, 10) + '...' : 'MISSING',
    modelId: RUNWAY_MODEL_ID,
  });
  
  if (!RUNWAY_API_KEY) {
    const error = 'RUNWAY_API_KEY is not set. Please configure it in your environment variables.';
    console.error('[Runway API]', error);
    throw new Error(error);
  }

  console.log('[Runway API] Starting video generation request using SDK');
  console.log('[Runway API] Config:', {
    modelId: RUNWAY_MODEL_ID,
    hasApiKey: !!RUNWAY_API_KEY,
    imageUrl: request.imageUrl?.substring(0, 100) + '...',
    promptLength: request.prompt.length,
    duration: request.duration || 8,
  });

  try {
    const client = getRunwayClient();
    
    // Use SDK to create image-to-video task
    // SDK handles authentication, request formatting, and error handling
    console.log('[Runway API] Calling SDK imageToVideo.create()');
    
    // For gen4_turbo, ratio is REQUIRED
    // Available ratios: '1280:720', '720:1280', '1104:832', '832:1104', '960:960', '1584:672'
    // Using '1280:720' (16:9 landscape) as default - adjust based on your needs
    const task = await client.imageToVideo.create({
      model: RUNWAY_MODEL_ID as 'gen4_turbo',
      promptImage: request.imageUrl, // SDK expects 'promptImage' not 'image'
      promptText: request.prompt, // SDK expects 'promptText' - optional for gen4_turbo but we're providing it
      duration: request.duration || 8,
      ratio: '1280:720', // REQUIRED for gen4_turbo - using 16:9 landscape as default
    });

    console.log('[Runway API] Task created with ID:', task.id);

    const runwayVideoId = task.id;

    if (!runwayVideoId) {
      console.error('[Runway API] ERROR: No video ID found in SDK response!');
      console.error('[Runway API] Full task response:', JSON.stringify(task, null, 2));
      throw new Error('Runway API did not return a task ID');
    }
    
    // Retrieve the task immediately to get the initial status
    // This ensures we have the correct status from the start
    console.log('[Runway API] Retrieving initial task status for ID:', runwayVideoId);
    const initialTask = await client.tasks.retrieve(runwayVideoId);
    
    console.log('[Runway API] Initial task status:', {
      id: initialTask.id,
      status: initialTask.status,
      hasOutput: !!initialTask.output && initialTask.output.length > 0,
      failure: initialTask.failure,
    });

    // Extract video URL and error from initial task response
    const videoUrl = initialTask.output && initialTask.output.length > 0 ? initialTask.output[0] : undefined;
    const error = initialTask.failure || undefined;
    
    return {
      id: runwayVideoId,
      status: mapRunwayStatus(initialTask.status),
      videoUrl: videoUrl,
      error: error,
    };
  } catch (error) {
    console.error('[Runway API] Exception:', error);
    
    if (error instanceof Error) {
      // SDK provides better error messages
      throw error;
    }
    throw new Error(`Unexpected error calling Runway API: ${String(error)}`);
  }
}

/**
 * Map Runway API status to our internal status format
 * 
 * Runway SDK uses: 'PENDING', 'THROTTLED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'
 * We map to: 'queued', 'processing', 'succeeded', 'failed'
 */
function mapRunwayStatus(runwayStatus: string): 'queued' | 'processing' | 'succeeded' | 'failed' {
  const statusUpper = runwayStatus.toUpperCase();
  
  // Map Runway SDK status values to our internal format
  if (statusUpper === 'SUCCEEDED') {
    return 'succeeded';
  }
  if (statusUpper === 'FAILED' || statusUpper === 'CANCELLED') {
    return 'failed';
  }
  if (statusUpper === 'RUNNING') {
    return 'processing';
  }
  // PENDING, THROTTLED, or any unknown status -> 'queued'
  return 'queued';
}

/**
 * Check the status of a video generation job using Runway SDK
 * 
 * Uses the official RunwayML SDK to retrieve task status
 */
export async function checkVideoStatus(videoId: string): Promise<RunwayVideoResponse> {
  if (!RUNWAY_API_KEY) {
    throw new Error('RUNWAY_API_KEY is not set');
  }

  if (!videoId) {
    throw new Error('Video ID is required to check status');
  }

  try {
    console.log('[Runway API] Checking video status for task ID:', videoId);
    
    const client = getRunwayClient();
    
    // Use SDK to retrieve task status
    // SDK handles authentication and request formatting
    const task = await client.tasks.retrieve(videoId);

    console.log('[Runway API] Task status response:', {
      id: task.id,
      status: task.status,
      hasOutput: !!task.output && task.output.length > 0,
      outputCount: task.output?.length || 0,
      failure: task.failure,
      failureCode: task.failureCode,
      progress: task.progress,
    });

    // Extract video URL from task.output array
    // When status is 'SUCCEEDED', task.output is an array of URLs
    // Each URL is a string (not an object with a url property)
    const videoUrl = task.output && task.output.length > 0 ? task.output[0] : undefined;
    
    // Extract error message from task.failure (when status is 'FAILED')
    const error = task.failure || undefined;

    console.log('[Runway API] Extracted from task:', {
      hasVideoUrl: !!videoUrl,
      videoUrl: videoUrl?.substring(0, 100) + '...' || 'none',
      error,
    });
    
    return {
      id: task.id || videoId,
      status: mapRunwayStatus(task.status),
      videoUrl: videoUrl,
      error: error,
    };
  } catch (error) {
    console.error('[Runway API] Error checking video status:', error);
    
    if (error instanceof Error) {
      // SDK provides better error messages
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


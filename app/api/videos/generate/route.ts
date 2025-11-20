import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";
import { generateVideo as generateVideoRunComfy } from "@/lib/runcomfy";
import { generateDancePrompt, generateVideo as generateVideoRunway, checkVideoStatus as checkVideoStatusRunway } from "@/lib/runway";
import { createClient } from "@supabase/supabase-js";
import { processImageTo9x16, uploadProcessedImage, get9x16Dimensions } from "@/lib/imageProcessing";
import { getAudioUrlForDanceStyle } from "@/lib/audio-mapping";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for video generation

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase configuration");
}

/**
 * POST /api/videos/generate
 * Generate a dancing video for a pet
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl, danceStyle, petDescription } = body;

    if (!imageUrl || !danceStyle) {
      return NextResponse.json(
        { error: "Missing required fields: imageUrl and danceStyle" },
        { status: 400 }
      );
    }

    // Check user has credits
    const { data: creditsData, error: creditsError } = await supabase
      .from("credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (creditsError || !creditsData || creditsData.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits. Please subscribe to generate videos." },
        { status: 403 }
      );
    }

    // Generate dance prompt using OpenAI (if configured) or fallback template
    const prompt = await generateDancePrompt(danceStyle, petDescription);

    // Create video record in database
    const serviceSupabase = createClient<Database>(
      supabaseUrl as string,
      supabaseServiceRoleKey as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: videoRecord, error: videoError } = await serviceSupabase
      .from("videos")
      .insert({
        user_id: user.id,
        input_image_url: imageUrl,
        dance_style: danceStyle,
        prompt: prompt,
        status: "queued",
        provider: "runcomfy",
      })
      .select()
      .single();

    if (videoError) {
      console.error("Error creating video record:", videoError);
      return NextResponse.json(
        { error: "Failed to create video record" },
        { status: 500 }
      );
    }

    if (!videoRecord) {
      console.error("Video record was not created");
      return NextResponse.json(
        { error: "Failed to create video record" },
        { status: 500 }
      );
    }

    // Deduct credit immediately
    const { error: creditUpdateError } = await serviceSupabase
      .from("credits")
      .update({
        credits: creditsData.credits - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (creditUpdateError) {
      console.error("Error deducting credit:", creditUpdateError);
      // Note: In production, you might want to rollback the video record
      // or implement a transaction
    }

    // CRITICAL FIX: Vercel serverless functions terminate when the response is sent
    // We MUST create the Runway task and save the runway_video_id BEFORE returning
    // Otherwise, the background async operation will be killed and never complete
    
    const videoId = videoRecord.id;
    console.log(`[Video Generation] Starting video generation for video ${videoId}`);
    console.log(`[Video Generation] Environment check:`, {
      hasRunComfyApiKey: !!process.env.RUNCOMFY_API_KEY,
    });
    
    try {
      // Update status to processing immediately
      console.log(`[Video Generation] Updating video ${videoId} status to processing`);
      const { error: updateError } = await serviceSupabase
        .from("videos")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);
        
      if (updateError) {
        console.error(`[Video Generation] Failed to update status to processing:`, updateError);
        throw new Error(`Failed to update video status: ${updateError.message}`);
      }

      // Process image to 9:16 aspect ratio before sending to API
      console.log(`[Video Generation] Processing image to 9:16 aspect ratio for video ${videoId}`);
      const targetDimensions = get9x16Dimensions('480P');
      let processedImageUrl = imageUrl;
      
      try {
        const processedBuffer = await processImageTo9x16(imageUrl, targetDimensions.height);
        // Extract filename from original URL
        const urlParts = imageUrl.split('/');
        const originalFilename = urlParts[urlParts.length - 1] || 'image.jpg';
        processedImageUrl = await uploadProcessedImage(processedBuffer, user.id, originalFilename);
        console.log(`[Video Generation] Image processed to 9:16, new URL: ${processedImageUrl.substring(0, 100)}...`);
      } catch (processingError) {
        console.error(`[Video Generation] Failed to process image to 9:16, using original:`, processingError);
        // Continue with original image if processing fails
        processedImageUrl = imageUrl;
      }

      // Get audio URL for the selected dance style (optional - skip if URL is invalid)
      let audioUrl: string | undefined = undefined;
      try {
        const audioUrlResult = getAudioUrlForDanceStyle(danceStyle);
        if (audioUrlResult && audioUrlResult.startsWith('http')) {
          // Only use audio URL if it's a valid HTTP(S) URL (not localhost in production)
          if (!audioUrlResult.includes('localhost') || process.env.NODE_ENV === 'development') {
            audioUrl = audioUrlResult;
            console.log(`[Video Generation] Using audio for dance style ${danceStyle}: ${audioUrl}`);
          } else {
            console.warn(`[Video Generation] Skipping audio URL (localhost in production): ${audioUrlResult}`);
          }
        } else if (audioUrlResult) {
          console.warn(`[Video Generation] Invalid audio URL format, skipping: ${audioUrlResult}`);
        }
      } catch (audioError) {
        console.error(`[Video Generation] Error getting audio URL, proceeding without audio:`, audioError);
      }
      
      if (!audioUrl) {
        console.log(`[Video Generation] Proceeding without audio for dance style: ${danceStyle}`);
      }

      // CRITICAL: Call RunComfy API first, with Runway as fallback
      // This ensures the runway_video_id is saved before Vercel kills the function
      console.log(`[Video Generation] Attempting RunComfy API first for video ${videoId}`);
      console.log(`[Video Generation] API call parameters:`, {
        imageUrl: processedImageUrl.substring(0, 100) + '...',
        promptLength: prompt.length,
        duration: 10,
        resolution: '480P',
        hasAudioUrl: !!audioUrl,
        audioUrl: audioUrl ? audioUrl.substring(0, 100) + '...' : 'none',
      });
      
      let videoResponse;
      let provider = 'runcomfy'; // Default provider
      let usedFallback = false;
      
      // Try RunComfy first
      try {
        videoResponse = await generateVideoRunComfy({
          imageUrl: processedImageUrl, // Use processed 9:16 image
          prompt,
          duration: 10, // Wan 2.5 supports 5 or 10 seconds
          resolution: '480P', // 480P, 720P, or 1080P
          negativePrompt: 'plain background, white background, empty background, solid color background, blank background, simple background, minimal background, cropped pet, pet out of frame, partial pet, pet cut off, pet partially visible, pet cropped out',
          audioUrl: audioUrl || undefined, // Include audio URL if available
        });
        console.log(`[Video Generation] RunComfy API call completed successfully`);
      } catch (runcomfyError) {
        console.error(`[Video Generation] RunComfy API call failed:`, {
          error: runcomfyError instanceof Error ? runcomfyError.message : String(runcomfyError),
          stack: runcomfyError instanceof Error ? runcomfyError.stack : undefined,
        });
        
        // Check if Runway is available as fallback
        const hasRunwayKey = !!process.env.RUNWAY_API_KEY || !!process.env.RUNWAYML_API_SECRET;
        
        if (hasRunwayKey) {
          console.log(`[Video Generation] RunComfy failed, falling back to Runway API for video ${videoId}`);
          usedFallback = true;
          provider = 'runway';
          
          try {
            // Truncate prompt for Runway (max 1000 chars)
            const runwayPrompt = prompt.length > 1000 ? prompt.substring(0, 1000) : prompt;
            
            videoResponse = await generateVideoRunway({
              imageUrl: processedImageUrl, // Use processed 9:16 image
              prompt: runwayPrompt,
              duration: 8, // Runway default duration
            });
            console.log(`[Video Generation] Runway API fallback call completed successfully`);
          } catch (runwayError) {
            console.error(`[Video Generation] Runway API fallback also failed:`, {
              error: runwayError instanceof Error ? runwayError.message : String(runwayError),
            });
            // Both providers failed - throw the original RunComfy error
            throw runcomfyError;
          }
        } else {
          console.error(`[Video Generation] RunComfy failed and Runway API key not configured, cannot use fallback`);
          throw runcomfyError;
        }
      }
      
      console.log(`[Video Generation] ${provider.toUpperCase()} API response for video ${videoId}:`, {
        id: videoResponse.id,
        status: videoResponse.status,
        hasVideoUrl: !!videoResponse.videoUrl,
        error: videoResponse.error,
        usedFallback,
      });

      if (!videoResponse.id) {
        console.error(`[Video Generation] CRITICAL: ${provider.toUpperCase()} API returned no request_id for video ${videoId}!`);
        throw new Error(`${provider.toUpperCase()} API did not return a request_id`);
      }

      // CRITICAL: Save the runway_video_id and provider BEFORE returning the response
      // This is the key fix - we must save it synchronously, not in a background task
      console.log(`[Video Generation] Saving ${provider} request_id for video ${videoId}: ${videoResponse.id}`);
      const { error: updateResponseError, data: updateData } = await serviceSupabase
        .from("videos")
        .update({
          status: videoResponse.status,
          video_url: videoResponse.videoUrl || null,
          error_message: videoResponse.error || null,
          runway_video_id: videoResponse.id, // Save the request_id (works for both providers)
          provider: provider, // Save which provider was used
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId)
        .select();
        
      if (updateResponseError) {
        console.error(`[Video Generation] FAILED to save ${provider} request_id:`, updateResponseError);
        throw new Error(`Failed to save ${provider} request_id: ${updateResponseError.message}`);
      }
      
      console.log(`[Video Generation] Successfully saved ${provider} request_id for video ${videoId}: ${videoResponse.id}`);
      if (usedFallback) {
        console.log(`[Video Generation] ⚠️ Used Runway as fallback after RunComfy failure`);
      }
      console.log(`[Video Generation] Updated record:`, updateData?.[0] ? {
        id: updateData[0].id,
        status: updateData[0].status,
        provider: updateData[0].provider,
        runway_video_id: updateData[0].runway_video_id,
      } : 'No data returned');

      // Return success response
      // The status endpoint will poll for completion
      return NextResponse.json({
        videoId: videoId,
        status: videoResponse.status,
        message: "Video generation started",
      });
    } catch (error) {
      // If RunComfy API call fails, update video status to failed
      console.error(`[Video Generation] Error creating RunComfy task for video ${videoId}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      try {
        await serviceSupabase
          .from("videos")
          .update({
            status: "failed",
            error_message: errorMessage.substring(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq("id", videoId);
        console.log(`[Video Generation] Updated video ${videoId} status to failed`);
      } catch (updateErr) {
        console.error(`[Video Generation] Failed to update video status to failed:`, updateErr);
      }
      
      // Return error response
      return NextResponse.json(
        { error: `Failed to start video generation: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate video asynchronously
 * This function handles the actual video generation with Runway API
 */
async function generateVideoAsync(
  videoId: string,
  imageUrl: string,
  prompt: string,
  danceStyle: string,
  supabase: ReturnType<typeof createClient<Database, "public">>
) {
  console.log(`[Video Generation] Starting generateVideoAsync for video ${videoId}`);
  console.log(`[Video Generation] Image URL: ${imageUrl}`);
  console.log(`[Video Generation] Prompt: ${prompt.substring(0, 100)}...`);
  
  try {
    // Update status to processing
    console.log(`[Video Generation] Updating video ${videoId} status to processing`);
    const { error: updateError } = await supabase
      .from("videos")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);
      
    if (updateError) {
      console.error(`[Video Generation] Failed to update status to processing:`, updateError);
      throw new Error(`Failed to update video status: ${updateError.message}`);
    }

    // Call RunComfy API to generate video
    console.log(`[Video Generation] Calling RunComfy API for video ${videoId}`);
    console.log(`[Video Generation] RunComfy API call parameters:`, {
      imageUrl: imageUrl.substring(0, 100) + '...',
      promptLength: prompt.length,
      duration: 8,
    });
    
    let videoResponse;
    try {
      // Get audio URL for the selected dance style
      const audioUrl = getAudioUrlForDanceStyle(danceStyle);
      if (audioUrl) {
        console.log(`[Video Generation Async] Using audio for dance style ${danceStyle}: ${audioUrl}`);
      }

      videoResponse = await generateVideo({
        imageUrl,
        prompt,
        duration: 10, // Wan 2.5 supports 5 or 10 seconds
        resolution: '480P', // 480P, 720P, or 1080P
        negativePrompt: 'plain background, white background, empty background, solid color background, blank background, simple background, minimal background, cropped pet, pet out of frame, partial pet, pet cut off, pet partially visible, pet cropped out',
        audioUrl: audioUrl || undefined, // Include audio URL if available
      });
      console.log(`[Video Generation] RunComfy API call SUCCESS for video ${videoId}`);
    } catch (sdkError) {
      console.error(`[Video Generation] RunComfy API call FAILED for video ${videoId}:`, {
        error: sdkError instanceof Error ? sdkError.message : String(sdkError),
        stack: sdkError instanceof Error ? sdkError.stack : undefined,
        errorType: sdkError?.constructor?.name,
        fullError: sdkError,
      });
      throw sdkError; // Re-throw to be caught by outer catch
    }
    
    console.log(`[Video Generation] RunComfy API response for video ${videoId}:`, {
      id: videoResponse.id,
      status: videoResponse.status,
      hasVideoUrl: !!videoResponse.videoUrl,
      error: videoResponse.error,
    });
    
    if (!videoResponse.id) {
      console.error(`[Video Generation] CRITICAL: RunComfy API returned no request_id for video ${videoId}!`);
      console.error(`[Video Generation] Full response:`, JSON.stringify(videoResponse, null, 2));
      throw new Error('RunComfy API did not return a request_id');
    }

    // Update video record with result, including RunComfy request_id
    console.log(`[Video Generation] Updating video ${videoId} with RunComfy response`);
    console.log(`[Video Generation] Update payload:`, {
      status: videoResponse.status,
      hasVideoUrl: !!videoResponse.videoUrl,
      runway_video_id: videoResponse.id,
      error: videoResponse.error,
    });
    
    const { error: updateResponseError, data: updateData } = await supabase
      .from("videos")
      .update({
        status: videoResponse.status,
        video_url: videoResponse.videoUrl || null,
        error_message: videoResponse.error || null,
        runway_video_id: videoResponse.id || null, // CRITICAL: Save RunComfy request_id (reusing field name)
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId)
      .select();
      
    if (updateResponseError) {
      console.error(`[Video Generation] FAILED to update video with Runway response:`, updateResponseError);
      console.error(`[Video Generation] Update error details:`, {
        code: updateResponseError.code,
        message: updateResponseError.message,
        details: updateResponseError.details,
        hint: updateResponseError.hint,
      });
      throw new Error(`Failed to update video record: ${updateResponseError.message}`);
    }
    
    console.log(`[Video Generation] Successfully updated video ${videoId} with RunComfy request_id: ${videoResponse.id}`);
    console.log(`[Video Generation] Updated record:`, updateData?.[0] ? {
      id: updateData[0].id,
      status: updateData[0].status,
      runway_video_id: updateData[0].runway_video_id,
    } : 'No data returned');

    // If status is still processing or queued, the status endpoint will poll for updates
    if (videoResponse.status === "processing" || videoResponse.status === "queued") {
      console.log(
        `[Video Generation] Video ${videoId} is ${videoResponse.status}. ` +
        `RunComfy request_id: ${videoResponse.id}. ` +
        `Status will be checked via polling.`
      );
    } else if (videoResponse.status === "succeeded") {
      console.log(`[Video Generation] Video ${videoId} generation succeeded! Video URL: ${videoResponse.videoUrl}`);
    } else if (videoResponse.status === "failed") {
      console.error(`[Video Generation] Video ${videoId} generation failed. Error: ${videoResponse.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`[Video Generation] Exception in generateVideoAsync for video ${videoId}:`, {
      errorMessage,
      errorStack,
      error: error instanceof Error ? error : String(error),
    });

    // Update video status to failed
    try {
      const { error: updateError } = await supabase
        .from("videos")
        .update({
          status: "failed",
          error_message: errorMessage.substring(0, 500), // Limit error message length
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);
        
      if (updateError) {
        console.error(`[Video Generation] Failed to update video status to failed:`, updateError);
      } else {
        console.log(`[Video Generation] Updated video ${videoId} status to failed`);
      }
    } catch (updateErr) {
      console.error(`[Video Generation] Exception while updating video status to failed:`, updateErr);
    }

    throw error;
  }
}


import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";
import { generateVideo, generateDancePrompt } from "@/lib/runway";
import { createClient } from "@supabase/supabase-js";

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
        provider: "runway",
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

    // Start video generation asynchronously
    // Note: In Vercel serverless, we need to ensure the function completes
    // The async operation will run, but we return immediately to the user
    const videoId = videoRecord.id;
    console.log(`[Video Generation] Starting async video generation for video ${videoId}`);
    console.log(`[Video Generation] Environment check:`, {
      hasRunwayApiKey: !!process.env.RUNWAY_API_KEY,
      runwayBaseUrl: process.env.RUNWAY_BASE_URL || 'not set',
      runwayModelId: process.env.RUNWAY_MODEL_ID || 'not set',
    });
    
    // Start the async operation - don't await it
    // Vercel serverless functions will continue running for a short time after response
    // For production, consider using a job queue (e.g., Inngest, Trigger.dev, or Vercel Cron + API)
    generateVideoAsync(videoId, imageUrl, prompt, serviceSupabase).catch(
      async (error) => {
        console.error(`[Video Generation] Error in async video generation for video ${videoId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : String(error);
        
        console.error(`[Video Generation] Full error details:`, {
          videoId,
          errorMessage,
          errorStack,
          error: error instanceof Error ? error : String(error),
        });
        
        // Update video status to failed
        try {
          const { error: updateError } = await serviceSupabase
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
          console.error(`[Video Generation] Exception while updating video status:`, updateErr);
        }
      }
    );
    
    // Log that we've started the async operation
    console.log(`[Video Generation] Async operation started for video ${videoId}. Function will continue in background.`);

    return NextResponse.json({
      videoId: videoId,
      status: "queued",
      message: "Video generation started",
    });
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

    // Call Runway API to generate video
    console.log(`[Video Generation] Calling Runway API for video ${videoId}`);
    const videoResponse = await generateVideo({
      imageUrl,
      prompt,
      duration: 8, // 8 seconds default
    });
    
    console.log(`[Video Generation] Runway API response for video ${videoId}:`, {
      id: videoResponse.id,
      status: videoResponse.status,
      hasVideoUrl: !!videoResponse.videoUrl,
      error: videoResponse.error,
    });

    // Update video record with result, including Runway video ID
    console.log(`[Video Generation] Updating video ${videoId} with Runway response`);
    const { error: updateResponseError } = await supabase
      .from("videos")
      .update({
        status: videoResponse.status,
        video_url: videoResponse.videoUrl || null,
        error_message: videoResponse.error || null,
        runway_video_id: videoResponse.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);
      
    if (updateResponseError) {
      console.error(`[Video Generation] Failed to update video with Runway response:`, updateResponseError);
      throw new Error(`Failed to update video record: ${updateResponseError.message}`);
    }

    // If status is still processing or queued, the status endpoint will poll for updates
    if (videoResponse.status === "processing" || videoResponse.status === "queued") {
      console.log(
        `[Video Generation] Video ${videoId} is ${videoResponse.status}. ` +
        `Runway video ID: ${videoResponse.id}. ` +
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


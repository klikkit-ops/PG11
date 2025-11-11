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
    // In a production environment, you might want to use a job queue
    const videoId = videoRecord.id;
    generateVideoAsync(videoId, imageUrl, prompt, serviceSupabase).catch(
      (error) => {
        console.error("Error in async video generation:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Update video status to failed
        serviceSupabase
          .from("videos")
          .update({
            status: "failed",
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", videoId);
      }
    );

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
  try {
    // Update status to processing
    await supabase
      .from("videos")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    // Call Runway API to generate video
    const videoResponse = await generateVideo({
      imageUrl,
      prompt,
      duration: 8, // 8 seconds default
    });

    // Update video record with result
    await supabase
      .from("videos")
      .update({
        status: videoResponse.status,
        video_url: videoResponse.videoUrl || null,
        error_message: videoResponse.error || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    // If status is still processing, we need to poll for completion
    if (videoResponse.status === "processing" || videoResponse.status === "queued") {
      // In a real implementation, you would set up a webhook or polling mechanism
      // to check the video status and update the database when it's ready
      // For now, we'll leave it in processing state
      console.log(`Video ${videoId} is processing. Set up webhook or polling to check status.`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in video generation:", errorMessage);

    // Update video status to failed
    await supabase
      .from("videos")
      .update({
        status: "failed",
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    throw error;
  }
}


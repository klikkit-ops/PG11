import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";
import { checkVideoStatus } from "@/lib/runcomfy";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase configuration");
}

/**
 * GET /api/videos/status?videoId=xxx
 * Check the status of a video generation
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing videoId parameter" },
        { status: 400 }
      );
    }

    // Get video record
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // If video is still processing, or if it's succeeded but missing video_url, check with RunComfy API
    if (video.status === "processing" || video.status === "queued" || (video.status === "succeeded" && !video.video_url)) {
      try {
        // Get the RunComfy request_id from the database (stored in runway_video_id field)
        const runcomfyRequestId = video.runway_video_id;
        
        console.log(`[Status] Checking RunComfy for video ${videoId}:`, {
          currentStatus: video.status,
          hasVideoUrl: !!video.video_url,
          runcomfyRequestId: runcomfyRequestId,
        });
        
        if (runcomfyRequestId) {
          // Check status with RunComfy API
          const statusResponse = await checkVideoStatus(runcomfyRequestId);
          
          console.log(`[Status] RunComfy status response for video ${videoId}:`, {
            status: statusResponse.status,
            hasVideoUrl: !!statusResponse.videoUrl,
            videoUrl: statusResponse.videoUrl?.substring(0, 100),
            error: statusResponse.error,
          });
          
          // Update database if status changed OR if we have a new video URL
          // This ensures we update even if status is already "succeeded" but video_url is missing
          const shouldUpdate = statusResponse.status !== video.status || statusResponse.videoUrl || (statusResponse.status === 'succeeded' && !video.video_url);
          
          console.log(`[Status] Should update video ${videoId}?`, {
            shouldUpdate,
            statusChanged: statusResponse.status !== video.status,
            hasNewVideoUrl: !!statusResponse.videoUrl,
            isSucceededWithoutUrl: statusResponse.status === 'succeeded' && !video.video_url,
          });
          
          if (shouldUpdate) {
            const serviceSupabase = createClient<Database>(
              supabaseUrl!,
              supabaseServiceRoleKey!,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                },
              }
            );
            
            // Use the video URL from RunComfy response directly (no watermarking for now)
            let finalVideoUrl = statusResponse.videoUrl || video.video_url || null;
            
            console.log(`[Status] Final video URL for video ${videoId}:`, {
              fromRunComfy: !!statusResponse.videoUrl,
              fromDatabase: !!video.video_url,
              finalUrl: finalVideoUrl?.substring(0, 100),
            });
            
            await serviceSupabase
              .from("videos")
              .update({
                status: statusResponse.status,
                video_url: finalVideoUrl,
                error_message: statusResponse.error || video.error_message || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", videoId);
            
            // Update local video object for response
            video.status = statusResponse.status;
            video.video_url = finalVideoUrl;
            if (statusResponse.error) {
              video.error_message = statusResponse.error;
            }
          }
        } else {
          console.warn(`Video ${videoId} is processing but no runcomfy_request_id found.`);
        }
      } catch (error) {
        console.error("Error checking video status with RunComfy API:", error);
        // Continue and return current database status
        // Don't fail the request if RunComfy API check fails
      }
    }

    return NextResponse.json({
      id: video.id,
      status: video.status,
      videoUrl: video.video_url,
      errorMessage: video.error_message,
      danceStyle: video.dance_style,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
    });
  } catch (error) {
    console.error("Error getting video status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


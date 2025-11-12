import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";
import { checkVideoStatus } from "@/lib/runway";
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

    // If video is still processing, check with Runway API
    if (video.status === "processing" || video.status === "queued") {
      try {
        // Get the Runway video ID from the database
        const runwayVideoId = video.runway_video_id;
        
        if (runwayVideoId) {
          // Check status with Runway API
          const statusResponse = await checkVideoStatus(runwayVideoId);
          
          // Update database if status changed
          if (statusResponse.status !== video.status || statusResponse.videoUrl) {
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
            
            await serviceSupabase
              .from("videos")
              .update({
                status: statusResponse.status,
                video_url: statusResponse.videoUrl || video.video_url || null,
                error_message: statusResponse.error || video.error_message || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", videoId);
            
            // Update local video object for response
            video.status = statusResponse.status;
            if (statusResponse.videoUrl) {
              video.video_url = statusResponse.videoUrl;
            }
            if (statusResponse.error) {
              video.error_message = statusResponse.error;
            }
          }
        } else {
          console.warn(`Video ${videoId} is processing but no runway_video_id found.`);
        }
      } catch (error) {
        console.error("Error checking video status with Runway API:", error);
        // Continue and return current database status
        // Don't fail the request if Runway API check fails
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


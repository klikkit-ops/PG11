import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";
import { checkVideoStatus as checkVideoStatusReplicate } from "@/lib/replicate";
import { createClient } from "@supabase/supabase-js";
import { downloadAndStoreVideo } from "@/lib/videoStorage";

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

    // If video has a Replicate URL (temporary), download and store it permanently
    if (video.video_url && (video.video_url.includes("replicate.com") || video.video_url.includes("replicate.delivery"))) {
      console.log(`[Video Status] Video ${videoId} has temporary Replicate URL, downloading and storing permanently...`);
      try {
        const storageResult = await downloadAndStoreVideo(
          video.video_url,
          user.id,
          videoId
        );
        
        if (storageResult.success) {
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
              video_url: storageResult.url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", videoId);
          
          video.video_url = storageResult.url;
          console.log(`[Video Status] Successfully migrated video to permanent storage: ${storageResult.url}`);
        }
      } catch (error) {
        console.error(`[Video Status] Error migrating video to permanent storage:`, error);
        // Continue with original URL
      }
    }

    // If video is still processing, check with Replicate API
    if (video.status === "processing" || video.status === "queued") {
      try {
        const predictionId = video.runway_video_id; // This field stores the Replicate prediction_id
        
        if (predictionId) {
          console.log(`[Video Status] Checking Replicate API for video ${videoId}, prediction_id: ${predictionId}`);
          const statusResponse = await checkVideoStatusReplicate(predictionId);
          
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
            
            // If video is ready and we have a Replicate URL, download and store it permanently
            let finalVideoUrl = statusResponse.videoUrl || video.video_url || null;
            
            if (statusResponse.status === "succeeded" && statusResponse.videoUrl) {
              // Check if this is a Replicate URL (contains replicate.com or cdn.replicate.delivery)
              const isReplicateUrl = statusResponse.videoUrl.includes("replicate.com") || 
                                    statusResponse.videoUrl.includes("replicate.delivery");
              
              // Check if we already stored it (not a Replicate URL or already a Blob URL)
              const isBlobUrl = finalVideoUrl && finalVideoUrl.includes("blob.vercel-storage.com");
              
              if (isReplicateUrl && !isBlobUrl) {
                console.log(`[Video Status] Downloading and storing video permanently for video ${videoId}`);
                try {
                  const storageResult = await downloadAndStoreVideo(
                    statusResponse.videoUrl,
                    user.id,
                    videoId
                  );
                  
                  if (storageResult.success) {
                    finalVideoUrl = storageResult.url;
                    console.log(`[Video Status] Successfully stored video permanently at: ${finalVideoUrl}`);
                  } else {
                    console.error(`[Video Status] Failed to store video permanently: ${storageResult.error}`);
                    // Keep the Replicate URL as fallback, but log the warning
                    // The video will expire after 24 hours, but at least it will work for now
                  }
                } catch (error) {
                  console.error(`[Video Status] Exception storing video permanently:`, error);
                  // Keep the Replicate URL as fallback
                }
              }
            }
            
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
            if (finalVideoUrl) {
              video.video_url = finalVideoUrl;
            }
            if (statusResponse.error) {
              video.error_message = statusResponse.error;
            }
          }
        } else {
          console.warn(`Video ${videoId} is processing but no prediction_id found.`);
        }
      } catch (error) {
        console.error(`Error checking video status with Replicate API:`, error);
        // Continue and return current database status
        // Don't fail the request if API check fails
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


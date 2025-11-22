/**
 * Download video from Replicate and store permanently in Vercel Blob
 * Replicate URLs expire after 24 hours, so we need to download and store them permanently
 */

import { put } from "@vercel/blob";

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

export interface DownloadVideoResult {
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Download a video from a URL (e.g., Replicate) and upload it to Vercel Blob Storage
 * @param videoUrl - The temporary URL from Replicate
 * @param userId - The user ID for organizing files
 * @param videoId - The video ID for the filename
 * @returns The permanent Vercel Blob URL
 */
export async function downloadAndStoreVideo(
  videoUrl: string,
  userId: string,
  videoId: string
): Promise<DownloadVideoResult> {
  if (!blobToken) {
    console.error("[VideoStorage] BLOB_READ_WRITE_TOKEN is not set");
    return {
      url: videoUrl, // Return original URL as fallback
      success: false,
      error: "Blob storage not configured",
    };
  }

  try {
    console.log(`[VideoStorage] Downloading video from Replicate: ${videoUrl.substring(0, 100)}...`);
    
    // Download video from Replicate URL
    const videoResponse = await fetch(videoUrl);
    
    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error(`[VideoStorage] Failed to download video: ${videoResponse.status} - ${errorText}`);
      return {
        url: videoUrl, // Return original URL as fallback
        success: false,
        error: `Failed to download video: ${videoResponse.status}`,
      };
    }

    // Get the video as an ArrayBuffer
    const videoBuffer = await videoResponse.arrayBuffer();
    
    // Determine content type from response or default to mp4
    const contentType = videoResponse.headers.get("content-type") || "video/mp4";
    
    console.log(`[VideoStorage] Downloaded ${videoBuffer.byteLength} bytes, uploading to Blob...`);

    // Generate filename for the video in user-generations folder
    const filename = `user-generations/${userId}/${videoId}-${Date.now()}.mp4`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, videoBuffer, {
      access: "public",
      token: blobToken,
      contentType: contentType,
    });

    console.log(`[VideoStorage] Successfully stored video at: ${blob.url}`);

    return {
      url: blob.url,
      success: true,
    };
  } catch (error) {
    console.error("[VideoStorage] Error downloading/storing video:", error);
    return {
      url: videoUrl, // Return original URL as fallback
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}


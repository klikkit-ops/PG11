"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  status: string;
}

interface VideosListPollingProps {
  videos: Video[];
}

/**
 * Client component that polls for video status updates on the videos list page
 * Automatically refreshes the page when any video completes
 */
export function VideosListPolling({ videos }: VideosListPollingProps) {
  const router = useRouter();
  const [pollingActive, setPollingActive] = useState(true);

  useEffect(() => {
    // Only poll if there are videos that are processing or queued
    const processingVideos = videos.filter(
      (v) => v.status === "processing" || v.status === "queued"
    );

    if (processingVideos.length === 0 || !pollingActive) {
      return;
    }

    console.log(`[VideosListPolling] Polling ${processingVideos.length} processing videos...`);

    const pollInterval = setInterval(async () => {
      try {
        // Poll all processing videos
        const statusChecks = processingVideos.map(async (video) => {
          try {
            const response = await fetch(`/api/videos/status?videoId=${video.id}`);
            if (response.ok) {
              const data = await response.json();
              // If status changed to succeeded or failed, trigger a refresh
              if (
                (data.status === "succeeded" || data.status === "failed") &&
                data.status !== video.status
              ) {
                console.log(`[VideosListPolling] Video ${video.id} status changed to ${data.status}, refreshing page...`);
                return true; // Indicate a status change
              }
            }
          } catch (error) {
            console.error(`[VideosListPolling] Error checking video ${video.id}:`, error);
          }
          return false;
        });

        const results = await Promise.all(statusChecks);
        
        // If any video completed, refresh the page
        if (results.some((changed) => changed)) {
          console.log("[VideosListPolling] Status change detected, refreshing page...");
          setPollingActive(false); // Stop polling before refresh
          router.refresh();
        }
      } catch (error) {
        console.error("[VideosListPolling] Error polling video statuses:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log("[VideosListPolling] Stopping polling");
      clearInterval(pollInterval);
    };
  }, [videos, pollingActive, router]);

  return null; // This component doesn't render anything
}


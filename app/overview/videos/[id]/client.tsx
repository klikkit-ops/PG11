"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface VideoStatus {
  id: string;
  status: string;
  videoUrl: string | null;
  errorMessage: string | null;
}

interface VideoStatusPollingProps {
  videoId: string;
  initialStatus: string;
}

export function VideoStatusPolling({ videoId, initialStatus }: VideoStatusPollingProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [hasVideoUrl, setHasVideoUrl] = useState(false);

  useEffect(() => {
    // Poll if video is still processing, queued, or succeeded but missing video URL
    if (status !== "processing" && status !== "queued" && !(status === "succeeded" && !hasVideoUrl)) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/videos/status?videoId=${videoId}`);
        if (response.ok) {
          const data: VideoStatus = await response.json();
          setStatus(data.status);
          setHasVideoUrl(!!data.videoUrl);

          // If video is ready with URL or failed, refresh the page to show the result
          if ((data.status === "succeeded" && data.videoUrl) || data.status === "failed") {
            clearInterval(pollInterval);
            router.refresh();
          }
        }
      } catch (error) {
        console.error("Error polling video status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [videoId, status, hasVideoUrl, router]);

  return null; // This component doesn't render anything
}


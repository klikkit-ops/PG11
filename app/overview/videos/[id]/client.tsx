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

  useEffect(() => {
    // Only poll if video is still processing
    if (status !== "processing" && status !== "queued") {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/videos/status?videoId=${videoId}`);
        if (response.ok) {
          const data: VideoStatus = await response.json();
          setStatus(data.status);

          // If video is ready or failed, refresh the page to show the result
          if (data.status === "succeeded" || data.status === "failed") {
            clearInterval(pollInterval);
            router.refresh();
          }
        }
      } catch (error) {
        console.error("Error polling video status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [videoId, status, router]);

  return null; // This component doesn't render anything
}


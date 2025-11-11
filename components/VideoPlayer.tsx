"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

export default function VideoPlayer({
  src,
  autoPlay = false,
  controls = true,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  }, [autoPlay, src]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls={controls}
      className={className}
      playsInline
    >
      Your browser does not support the video tag.
    </video>
  );
}


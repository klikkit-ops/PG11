"use client";

import { useState } from "react";
import Image from "next/image";

interface PetImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  children?: React.ReactNode;
}

export function PetImage({ src, alt, className, fill = true, children }: PetImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (imageError) {
    // If image fails to load, show gradient background with children (overlay)
    return (
      <div className={className || "relative w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10"}>
        {children}
      </div>
    );
  }

  return (
    <div className={className || "relative w-full h-full"}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={`object-cover ${!imageLoaded ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        onError={() => {
          setImageError(true);
        }}
        onLoad={() => {
          setImageLoaded(true);
        }}
        // Hide broken image icon
        style={{ objectFit: "cover" }}
      />
      {/* Overlay that covers broken images */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10" />
      )}
      {children}
    </div>
  );
}


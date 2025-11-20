"use client";

export function AnimatedPaws() {
  return (
    <div className="flex items-center justify-center gap-2">
      {/* Animated paw prints */}
      <div className="flex items-center gap-2">
        <PawPrint delay={0} />
        <PawPrint delay={0.2} />
        <PawPrint delay={0.4} />
        <PawPrint delay={0.6} />
      </div>
    </div>
  );
}

function PawPrint({ delay }: { delay: number }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      className="text-primary animate-bounce"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: "1.2s",
        animationIterationCount: "infinite",
      }}
    >
      {/* Main paw pad */}
      <ellipse
        cx="12"
        cy="16"
        rx="4"
        ry="5"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Top left toe */}
      <ellipse
        cx="8"
        cy="10"
        rx="2"
        ry="2.5"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Top right toe */}
      <ellipse
        cx="16"
        cy="10"
        rx="2"
        ry="2.5"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Middle toe */}
      <ellipse
        cx="12"
        cy="8"
        rx="1.5"
        ry="2"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}


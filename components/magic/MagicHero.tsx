import Image from "next/image";
import React, { useRef, useEffect } from "react";

type MagicHeroProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageSrc?: string;
};

// Playful hero inspired by Magic UI hero patterns.
// Uses daisyUI tokens and Tailwind utilities; no external deps required.
export function MagicHero({
  title,
  subtitle,
  ctaLabel = "Get Started",
  ctaHref = "/login",
  secondaryCtaLabel,
  secondaryCtaHref,
  imageSrc = "/hero.png",
  videoSrc,
  beforeImageSrc,
}: MagicHeroProps & { videoSrc?: string; beforeImageSrc?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure video plays on iOS Safari
  useEffect(() => {
    if (videoRef.current && videoSrc) {
      const video = videoRef.current;
      // Force play on iOS
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Video autoplay failed:", error);
        });
      }
    }
  }, [videoSrc]);
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:space-y-8">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight -mt-4 md:mt-0">
              {title}
            </h1>
            {subtitle && (
              <div className="flex items-start gap-1.5 md:block">
                <p className="text-lg md:text-xl text-base-content/70 flex-1 md:flex-none">{subtitle}</p>
                <div className="flex-shrink-0 w-52 h-52 md:hidden relative" style={{ top: '-3rem' }}>
                  <Image
                    src="/avatars/catballet.png"
                    alt="Dancing cat"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <a
                href={ctaHref}
                className="
                  inline-flex items-center justify-center
                  rounded-full px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-bold text-white
                  bg-gradient-to-r from-[#4C6FFF] via-[#A855F7] to-[#EC4899]
                  shadow-lg shadow-[#4C6FFF]/30
                  hover:scale-105 hover:shadow-xl transition-all duration-300
                "
              >
                {ctaLabel}
              </a>
              {secondaryCtaLabel && secondaryCtaHref && (
                <a
                  href={secondaryCtaHref}
                  className="
                    inline-flex items-center justify-center
                    rounded-full px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-bold
                    bg-white/10 backdrop-blur-md border border-white/20
                    hover:bg-white/20 hover:scale-105 hover:border-white/40
                    transition-all duration-300 shadow-sm
                  "
                >
                  {secondaryCtaLabel}
                </a>
              )}
            </div>
          </div>

          <div className="relative">
            {videoSrc && beforeImageSrc ? (
              <div className="relative flex items-center justify-center gap-4 md:gap-6">
                {/* Before Image */}
                <div className="relative w-1/2 max-w-[280px]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 shadow-sm z-10">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Original</span>
                  </div>
                  <div className="rounded-[2rem] shadow-xl bg-white/5 backdrop-blur-sm border border-white/20 p-2 rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-white/10">
                      <Image
                        src={beforeImageSrc}
                        alt="Original pet photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Magic Arrow */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                  <div className="mt-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 shadow-sm">
                    <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary uppercase tracking-wider">AI Magic</span>
                  </div>
                </div>

                {/* After Video */}
                <div className="relative w-1/2 max-w-[280px]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary px-3 py-1 rounded-full shadow-lg z-10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Result</span>
                  </div>
                  <div className="rounded-[2rem] shadow-2xl bg-white/5 backdrop-blur-sm border border-white/20 p-2 rotate-[3deg] hover:rotate-0 transition-transform duration-500">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black/10">
                      <video
                        ref={videoRef}
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        webkit-playsinline="true"
                        preload="auto"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] shadow-2xl bg-white/5 backdrop-blur-sm border border-white/20 p-2">
                {videoSrc ? (
                  <video
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="rounded-3xl w-full h-auto object-cover aspect-[4/3]"
                  />
                ) : (
                  <Image
                    src={imageSrc}
                    alt="App preview"
                    width={960}
                    height={640}
                    className="rounded-3xl w-full h-auto"
                    priority
                  />
                )}
              </div>
            )}

            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-primary/20 blur-2xl -z-10" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-secondary/20 blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default MagicHero;



import Image from "next/image";
import React from "react";

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
}: MagicHeroProps & { videoSrc?: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-base-content/70">{subtitle}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={ctaHref}
                className="
                  inline-flex items-center justify-center
                  rounded-full px-8 py-4 text-lg font-bold text-white
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
                    rounded-full px-8 py-4 text-lg font-bold
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
            {/* Decorative blobs inspired by Magic UI */}
            <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-primary/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-secondary/20 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default MagicHero;



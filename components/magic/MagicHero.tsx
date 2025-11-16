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
}: MagicHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-base-content/70">{subtitle}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={ctaHref}
                className="
                  inline-flex items-center justify-center
                  rounded-full px-6 py-3 text-sm font-semibold text-white
                  bg-gradient-to-r from-[#4C6FFF] via-[#A855F7] to-[#EC4899]
                  shadow-lg shadow-[#4C6FFF]/30
                  hover:opacity-95 transition
                "
              >
                {ctaLabel}
              </a>
              {secondaryCtaLabel && secondaryCtaHref && (
                <a href={secondaryCtaHref} className="btn btn-ghost font-medium">
                  {secondaryCtaLabel}
                </a>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-box shadow-xl bg-base-200 p-3 md:p-4">
              <Image
                src={imageSrc}
                alt="App preview"
                width={960}
                height={640}
                className="rounded-box w-full h-auto"
                priority
              />
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



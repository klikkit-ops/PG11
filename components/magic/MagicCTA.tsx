import React from "react";

type MagicCTAProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  ctaLabel: string;
  ctaHref: string;
};

// A friendly CTA band inspired by Magic UI callouts.
// Uses a colorful gradient and daisyUI button.
export function MagicCTA({ title, subtitle, ctaLabel, ctaHref }: MagicCTAProps) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="bg-base-300/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-2xl md:text-3xl font-extrabold">{title}</h3>
              {subtitle && (
                <p className="text-base-content/70">{subtitle}</p>
              )}
            </div>
            <div className="md:justify-self-end">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MagicCTA;



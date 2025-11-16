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
        <div className="rounded-box p-8 md:p-12 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border border-base-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-2xl md:text-3xl font-extrabold">{title}</h3>
              {subtitle && (
                <p className="text-base-content/70">{subtitle}</p>
              )}
            </div>
            <div className="md:justify-self-end">
              <a href={ctaHref} className="btn btn-primary btn-lg">
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



import React from "react";
import { LucideIcon } from "lucide-react";

type BentoItem = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

type MagicBentoProps = {
  heading?: string;
  items: BentoItem[];
};

// A simple bento/feature grid inspired by Magic UI components.
// Uses daisyUI cards for a playful, consistent look.
export function MagicBento({ heading, items }: MagicBentoProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {heading && (
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-8">
            {heading}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="card bg-base-200 shadow-md hover:shadow-lg transition">
                <div className="card-body">
                  {Icon && (
                    <div className="h-10 w-10 rounded-btn bg-primary/15 text-primary flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <h3 className="card-title">{item.title}</h3>
                  <p className="text-base-content/70">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MagicBento;



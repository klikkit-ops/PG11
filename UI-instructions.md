# PetGroove UI Theme & Refactor Instructions (for Cursor)

You are working in my Next.js app `headshots-starter` (PetGroove) inside the `PG11` folder.

Your job is to:

- Apply a **fun, colourful PetGroove theme** based on the palette below.
- Use a **soft, tinted background + white cards**.
- Keep **all business logic, routes, Supabase/Stripe/RunwayML** integrations intact.
- Optionally use **Magic UI** components as a style reference.

---

## 1. Tech Context

- Framework: Next.js 13/14, TypeScript, App Router.
- Styling: Tailwind CSS, shadcn/ui already present.
- New: daisyUI has been installed with `bun add -d daisyui`.
- Repo layout (approx):

  - `app/`
    - `layout.tsx`
    - `page.tsx` (landing page)
    - other routes: `create-video`, `videos`, `get-credits`, etc.
  - `components/`
  - `lib/`
  - `tailwind.config.(ts|js)`
  - `package.json`, `bun.lockb`, etc.

There may also be a sibling folder `magicui/` with the Magic UI repo cloned.

---

## 2. PetGroove Colour Palette

Use this palette as the **single source of truth** for the UI.

### Core Colours

- **Primary (PetGroove Blue)**: `#4C6FFF`  
  - Main CTAs, primary buttons, key highlights.
- **Secondary (Dance Purple)**: `#A855F7`  
  - Gradients, secondary buttons, tags.
- **Accent (Groove Pink)**: `#EC4899`  
  - Fun highlights, small accents, special states.
- **Accent 2 (Lime Pop)**: `#A3E635`  
  - Success highlights or tiny “sparkle” moments (use sparingly).

### Background & Text

- **Tinted page background top**: `#F3F1FF` (soft lavender)  
- **Tinted mid stop**: `#FDF2FF` (very light pink)  
- **Bottom stop / neutral**: `#F9FAFB`  
- **Card background**: `#FFFFFF`  
- **Primary text**: `#0F172A`  
- **Muted text**: `#6B7280`  
- **Subtle borders**: `#E5E7EB`

### Hero Gradient

Use this gradient for buttons, badges or large hero areas when appropriate:

- Tailwind gradient: `bg-gradient-to-r from-[#4C6FFF] via-[#A855F7] to-[#EC4899]`

---

## 3. Tailwind + daisyUI Configuration

**Goal:** Add a custom daisyUI theme called `"petgroove"` that encodes the palette above and keep all existing Tailwind/shadcn configuration.

### 3.1 Update `tailwind.config.ts`

1. Open `tailwind.config.ts` (or `.js`).
2. Ensure content paths include `app`, `components`, `lib`.
3. Ensure existing plugins (like `tailwindcss-animate`) remain.
4. Add `require("daisyui")` to `plugins`.
5. Add a `daisyui` theme named `"petgroove"` using the palette above.

Example (adapt to current file structure, **do not remove existing config**):

~~~ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Keep any existing customisations here (fonts, radii, etc.)
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("daisyui"), // ensure this is present
  ],
  daisyui: {
    themes: [
      {
        petgroove: {
          primary: "#4C6FFF",
          "primary-content": "#F9FAFF",
          secondary: "#A855F7",
          accent: "#EC4899",
          neutral: "#111827",
          "base-100": "#F3F1FF", // tinted background
          "base-200": "#E0E7FF",
          "base-300": "#FFFFFF", // white cards
          info: "#38BDF8",
          success: "#22C55E",
          warning: "#FACC15",
          error: "#EF4444",
        },
      },
      "light",
    ],
  },
};

export default config;
~~~

---

## 4. Global Layout & Background

**Goal:** Use a **fun tinted gradient background** with **white cards** everywhere.

### 4.1 Update `app/layout.tsx`

1. Set the HTML theme to `petgroove`.
2. Give `<body>` the gradient background and sensible defaults.
3. Keep all existing providers/wrappers; only adjust classes and attributes.

Example:

~~~tsx
// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PetGroove",
  description: "Turn your pet into a dancing star with AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="petgroove">
      <body
        className="
          min-h-screen
          bg-gradient-to-b
          from-[#F3F1FF]
          via-[#FDF2FF]
          to-[#F9FAFB]
          text-base-content
        "
      >
        {/* keep any existing providers, just wrap them around children */}
        {children}
      </body>
    </html>
  );
}
~~~

If there is already a provider hierarchy, integrate this `<body>` class and `data-theme` without removing providers.

---

## 5. Card & Component Styling Pattern

Across all pages, apply this **consistent card style** to main sections (upload panel, preview, pricing, etc.):

~~~tsx
<div className="bg-base-300/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60">
  {/* content */}
</div>
~~~

- `bg-base-300` → white from the PetGroove theme.
- Slight transparency + `backdrop-blur-sm` works nicely over the pastel gradient.
- Use `rounded-2xl` and `shadow-lg` consistently for major cards.

### Buttons

**Primary CTA button style** (maximum attention):

~~~tsx
<button className="btn btn-primary font-semibold px-6">
  Generate Video
</button>
~~~

**Gradient hero CTA**:

~~~tsx
<button
  className="
    inline-flex items-center justify-center
    rounded-full px-6 py-3 text-sm font-semibold text-white
    bg-gradient-to-r from-[#4C6FFF] via-[#A855F7] to-[#EC4899]
    shadow-lg shadow-[#4C6FFF]/30
    hover:opacity-95 transition
  "
>
  Start now
</button>
~~~

**Secondary button style**:

~~~tsx
<button className="btn btn-ghost font-medium">
  See examples
</button>
~~~

---

## 6. Page Unification Tasks

**Goal:** All pages should feel like one cohesive PetGroove app.

### 6.1 Identify Pages

Find and update:

- `app/page.tsx` (landing page)
- The upload/create-video page (where the dark UI currently lives)
- `app/videos` (history/list of videos)
- `app/get-credits` or similar (credits / pricing page)
- Any other main user-facing pages

### 6.2 Make Layouts Consistent

For each of these pages:

1. Use a centered content container:

   - Wrapper pattern:

   ~~~tsx
   <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
     {/* page sections */}
   </div>
   ~~~

2. Remove hard-coded dark backgrounds such as `bg-slate-900`, `bg-[#020617]`, etc.  
   The gradient is now on `<body>`, and content cards should use the white card pattern above.

3. Ensure headings and text sizes are consistent with the landing page (same font scale and weights).

### 6.3 Create/Refine Sections

- **Landing page:**
  - Hero with headline, subheading, and two buttons:
    - Primary: gradient “Start now”.
    - Secondary: ghost “See examples”.
  - “How it works” section as a 3–4 card grid using the white card pattern.

- **Create Video page:**
  - Keep the current 3-step structure:
    1. Upload your pet’s photo  
    2. Choose a dance  
    3. Watch the magic  
  - Use one or two large white cards inside the `max-w-6xl` container.
  - Headings in primary colour or neutral text, matching the landing page typography.

- **Get Credits / Pricing:**
  - Use white cards for each plan/option.
  - Buttons use the primary/secondary styles defined above.

- **Videos page:**
  - Grid or list of video cards, each using the white card pattern with a small thumbnail and metadata.

---

## 7. Optional: Magic UI Integration

If the `magicui` repo is present as a sibling folder:

1. Ensure there is a `components/magic/` directory in `headshots-starter`. Create it if needed.
2. In the `magicui` repo, pick 2–3 components that fit:
   - Hero section layout.
   - Bento / “How it works” cards.
   - A simple animated card row.
3. Copy their structure into `components/magic/` and:
   - Replace custom tokens with Tailwind/daisyUI classes from this spec.
   - Remove or adapt any imports that don’t exist here.
   - Use these components in the landing page and/or create-video page to add subtle animation and polish.

All Magic UI usage must be **presentational only**; do not change business logic.

---

## 8. Constraints & Reporting

**Do not:**

- Change `.env` files or environment variable names.
- Modify Supabase, Stripe, or RunwayML logic.
- Change API routes or database schema.

**Do:**

- Keep all changes strictly to styling, layout, and presentational components.
- Ensure the app compiles and runs with `bun run dev` after changes.
- Ensure mobile responsiveness.

At the end, provide:

1. A list of files you changed.
2. A short summary of how the new PetGroove theme is applied.
3. Any TODO notes where I may want to adjust copy or imagery.
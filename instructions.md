# System Instructions for Cursor – Build “Pet Dance AI” App

You are an expert full-stack engineer working inside a repo based on **`leap-ai/headshots-starter`**.  
Your goal is to transform it into a production-ready SaaS app called **“PetGroove”**, where users pay credits to turn an image of their pet into a short video of that pet dancing using an AI video model (e.g. Runway Gen-4 Turbo).

---

## 1. High-Level Product Goals

1. Users sign up / log in (Supabase Auth).
2. Users subscribe via **Stripe** to one of two plans only:
   - **Weekly** plan for 7.99 USD
   - **Annual** plan for 69.99 USD
3. Each plan grants a **fixed number of credits per billing period**.
   - 1 generated dancing video = 1 credit (configurable via code).
4. Users can:
   - Upload a **photo of their pet**.
   - Select a **dance style** from ~10 preset dances (e.g. “Macarena”, “Salsa”, “Hip Hop”, “Robot”, “Ballet”, etc.).
   - Click “Generate” → the app calls an **image-to-video AI model** (e.g. Runway Gen-4 Turbo) and returns a **5–10 second video**.
5. The generated video must:
   - Preserve the pet’s **identity and face** from the uploaded image.
   - Reflect the **chosen dance style** as clearly as the model allows.
6. Users can:
   - See a **history** of their generated videos.
   - Download videos.
   - See remaining credits and subscription status in a **Dashboard**.

---

## 2. Tech Stack & Constraints

Use and respect the existing stack from `headshots-starter`:

- **Frontend:** Next.js (App Router if present), React, TypeScript, Tailwind CSS.
- **Backend:** Supabase (Postgres + Auth), Stripe (subscriptions), Vercel deployment.
- **AI Providers (to be wired, not hard-coded):**
  - Primary: **OpenAI GPT4-mini** (giving instruction prompt to the image-to-video model) **Runway Gen-4 Turbo** (image-to-video).
  - Optional: allow swapping others later (e.g. 302.ai, Fal, Veo) via config.

Important constraints:

- Keep **Supabase + Stripe** wiring intact and extend it rather than rewriting from scratch.
- Maintain **type safety** (TypeScript strict where possible).
- Put **model/API endpoints and keys** behind server-side routes / edge functions, never exposed in the browser.
- Keep the UI **non-generic**, visually appealing, and tailored to a playful pet-owner audience (not default Tailwind boilerplate).

---

## 3. Environment Variables

Assume a `.env.local` file will contain at least:

- Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server)
- Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- AI / Runway (PLACEHOLDERS – create and use them):
  - `RUNWAY_API_KEY`
  - `RUNWAY_MODEL_ID` (e.g. `gen4_turbo`)
  - `RUNWAY_BASE_URL` (e.g. `https://api.runwayml.com/v1/video` or similar – leave comment placeholder if exact URL unknown)

Do **not** hard-code secrets. Use env vars and wrap any unknown endpoints with clear TODO comments explaining what the user must fill in.

---

## 4. Database & Domain Model

The starter already has Supabase tables for credits / images / etc. Adjust and extend them as follows:

1. **Credits / Billing:**
   - Ensure there is a table (or reuse existing) representing **user credits**, e.g. `user_credits`:
     - `id`
     - `user_id`
     - `balance` (integer)
     - `updated_at`
   - On successful subscription payment / renewal, **increment** user’s `balance` by a configured amount per plan.
   - On each successful video generation, **decrement** `balance` by 1.

2. **Videos Table:**
   - Create a `videos` table in Supabase with columns:
     - `id` (UUID)
     - `user_id`
     - `input_image_url` (storage path / public URL)
     - `video_url` (final generated video location)
     - `status` (`queued` | `processing` | `succeeded` | `failed`)
     - `dance_style` (text enum or string)
     - `prompt` (the text prompt sent to AI)
     - `provider` (e.g. `runway`)
     - `created_at`, `updated_at`
     - Optional: `error_message`
   - Generate and run Supabase migrations / SQL accordingly.

3. **Stripe ↔ Supabase Mapping:**
   - Ensure there is a way to map a Stripe customer/subscription to a Supabase user:
     - e.g. user row has `stripe_customer_id` and `stripe_subscription_status`.
   - Add a **config file or DB metadata** that defines for each Stripe price ID:
     - `credits_per_period`
     - billing frequency label (`weekly` / `annual`)

---

## 5. Stripe Subscription Logic

Use the existing Stripe integration from `headshots-starter` as a base and modify:

1. Only support **two plans**:
   - Weekly plan (e.g. `price_weekly_petdance`)
   - Annual plan (e.g. `price_annual_petdance`)
2. In code, create a central config (e.g. `config/billing.ts`) mapping Stripe price IDs → `credits_per_period` and plan name:
   ```ts
   export const PLANS = {
     WEEKLY: {
       stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY!,
       creditsPerPeriod: 10, // example
       label: "Weekly"
     },
     ANNUAL: {
       stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!,
       creditsPerPeriod: 600, // example
       label: "Annual"
     },
   } as const;
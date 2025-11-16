import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import HeroSection from "@/components/homepage/HeroSection"
import { MagicHero } from "@/components/magic/MagicHero"
import { MagicBento } from "@/components/magic/MagicBento"
import { MagicCTA } from "@/components/magic/MagicCTA"
import { Rocket, Wand2, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function Index({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createServerComponentClient({ cookies })

  // Check if there are auth-related query parameters (from Supabase redirect)
  // If so, redirect to the callback route to handle authentication
  if (searchParams) {
    const hasAuthParams = 
      'code' in searchParams || 
      'access_token' in searchParams || 
      'refresh_token' in searchParams ||
      'type' in searchParams ||
      'token' in searchParams;
    
    if (hasAuthParams) {
      // Build the callback URL with all query parameters
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (typeof value === 'string') {
          params.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        }
      });
      redirect(`/auth/callback?${params.toString()}`);
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to overview
  if (user) {
    return redirect("/overview")
  }

  // Check if there's a session in cookies but getUser() didn't find a user
  // This can happen right after Supabase verification when cookies are set
  // but the session hasn't been fully established yet
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    // Session exists, user is authenticated, redirect to overview
    return redirect("/overview")
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Keep the original hero for existing content structure */}
      <div className="flex-1">
        {/* New playful hero inspired by Magic UI; uses daisyUI tokens */}
        <MagicHero
          title={
            <>
              Make your pet <span className="text-primary">dance</span> with AI
            </>
          }
          subtitle="Upload a photo and generate fun, shareable dance videos in minutes."
          ctaLabel="Start now"
          ctaHref="/login"
          secondaryCtaLabel="See examples"
          secondaryCtaHref="/overview"
          imageSrc="/new-explainer.png"
        />

        {/* Feature / How it works section */}
        <MagicBento
          heading="How it works"
          items={[
            {
              title: "1. Upload a photo",
              description: "Use any clear photo of your pet or a headshot.",
              icon: Wand2,
            },
            {
              title: "2. Pick a dance style",
              description: "Choose from a variety of fun, trending styles.",
              icon: Sparkles,
            },
            {
              title: "3. Generate your video",
              description: "Our AI creates a high-quality, shareable clip.",
              icon: Rocket,
            },
            {
              title: "4. Download & share",
              description: "Save your video and show it off anywhere.",
            },
          ]}
        />

        {/* CTA linking into main flow */}
        <MagicCTA
          title="Ready to groove?"
          subtitle="Sign in to create your first dancing video today."
          ctaLabel="Get started"
          ctaHref="/login"
        />
      </div>
    </div>
  )
}

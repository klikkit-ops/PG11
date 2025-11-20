import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import HeroSection from "@/components/homepage/HeroSection"
import { MagicHero } from "@/components/magic/MagicHero"
import { MagicBento } from "@/components/magic/MagicBento"
import { MagicCTA } from "@/components/magic/MagicCTA"
import { PetAvatar } from "@/components/ui/pet-avatar"
import { Rocket, Wand2, Sparkles, Share2 } from "lucide-react"

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
                    videoSrc="https://xecbk3lwjslycmxl.public.blob.vercel-storage.com/Cat_s_Photorealistic_Macarena_Dance.mov"
                    beforeImageSrc="/cat-before.png"
                />

                {/* Feature / How it works section */}
                <div className="relative">
                    <PetAvatar petId={1} size="md" position="top-right" className="hidden 2xl:block" />
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
                                icon: Share2,
                            },
                        ]}
                    />
                </div>

                {/* SEO Content Section */}
                <section className="container mx-auto px-4 py-16 md:py-24 relative">
                    <PetAvatar petId={4} size="lg" position="bottom-left" className="hidden 2xl:block" />
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-all duration-500">
                                <img
                                    src="/pets-dance-party.png"
                                    alt="Pets having a dance party"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                                Why <span className="text-primary">PetGroove</span> is the #1 AI Pet Video Maker
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Transform your furry friend into a social media sensation! PetGroove uses advanced Artificial Intelligence to animate your pet's photos into hilarious, viral-worthy dance videos.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "🐶 Works with Dogs, Cats, and more!",
                                    "🎵 Trending TikTok & Instagram dance moves",
                                    "⚡ Instant AI generation - no editing skills needed",
                                    "✨ High-quality, shareable results"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-lg font-medium">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center text-sm">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

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

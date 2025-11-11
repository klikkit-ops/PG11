import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import HeroSection from "@/components/homepage/HeroSection"
import BrandsSection from "@/components/homepage/BrandsSection"
import ProcessSection from "@/components/homepage/ProcessSection"
import FeaturesSection from "@/components/homepage/FeaturesSection"
import ExamplesSection from "@/components/homepage/ExamplesSection"
import TestimonialsSection from "@/components/homepage/TestimonialsSection"
import PricingSection from "@/components/homepage/PricingSection"
import FAQSection from "@/components/homepage/FAQSection"
import CTASection from "@/components/homepage/CTASection"

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
      <div className="flex-1">
        <HeroSection />
        <BrandsSection />
        <ProcessSection />
        <FeaturesSection />
        <ExamplesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </div>
    </div>
  )
}

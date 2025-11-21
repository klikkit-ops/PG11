import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import CustomCheckout from "@/components/subscription/CustomCheckout";
import { PLANS } from "@/lib/billing";
import Image from "next/image";

type PlanType = "TRIAL" | "WEEKLY" | "ANNUAL";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const planType = (searchParams.plan as PlanType) || "TRIAL";

  // Validate plan type
  if (!(planType in PLANS)) {
    redirect("/get-credits");
  }

  const plan = PLANS[planType as keyof typeof PLANS];

  // For trial, check if user has already used it
  if (planType === "TRIAL" && 'trialDays' in plan) {
    const { data: creditsData } = await supabase
      .from("credits")
      .select("has_used_trial")
      .eq("user_id", user.id)
      .single();

    if (creditsData?.has_used_trial) {
      redirect("/get-credits?error=trial_used");
    }
  }

  const isTrial = planType === "TRIAL";
  const weeklyPlan = PLANS.WEEKLY;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-[40px] overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/get-credits" className="text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </a>
          </div>
          <div className="text-sm text-muted-foreground">
            {process.env.NODE_ENV === "development" && "TEST MODE"}
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Subscription Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Subscribe to {plan.label}
              </h1>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    {isTrial ? "$0.49" : `$${plan.price.toFixed(2)}`}
                  </span>
                  {isTrial ? (
                    <span className="text-muted-foreground text-lg">today</span>
                  ) : (
                    <span className="text-muted-foreground text-lg">
                      {plan.billingPeriod === "week" ? "per week" : "per year"}
                    </span>
                  )}
                </div>
                {isTrial && (
                  <div className="mt-3 text-muted-foreground text-base">
                    Then ${weeklyPlan.price.toFixed(2)} per week starting in 3 days
                  </div>
                )}
              </div>

              <div className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">{plan.creditsPerPeriod} Coins</div>
                    <div className="text-sm text-muted-foreground">
                      {isTrial ? "1 video generation" : `${plan.creditsPerPeriod / 100} video generations`}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">All dance styles included</div>
                    <div className="text-sm text-muted-foreground">
                      Access to all 10+ dance styles
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">HD video quality</div>
                    <div className="text-sm text-muted-foreground">
                      Perfect for sharing on social media
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Cancel anytime</div>
                    <div className="text-sm text-muted-foreground">
                      No long-term commitment
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">Pay with card</h2>
              <CustomCheckout planType={planType} userEmail={user.email || undefined} />
            </div>

            <div className="text-xs text-muted-foreground space-y-3">
              <p className="leading-relaxed">
                By confirming your subscription, you allow PetGroove to charge your card for this payment and future payments in accordance with our terms.
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/20">
                <span className="text-muted-foreground text-xs">Powered by</span>
                {/* Stripe Logo */}
                <Image
                  src="/logos/stripe-logo.png"
                  alt="Stripe"
                  width={60}
                  height={14}
                  className="h-3.5 w-auto"
                />
                <span className="ml-auto hover:text-foreground transition-colors cursor-pointer text-xs">Terms</span>
                <span className="hover:text-foreground transition-colors cursor-pointer text-xs">Privacy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


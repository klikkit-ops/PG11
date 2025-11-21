import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import CustomCheckout from "@/components/subscription/CustomCheckout";
import { PLANS } from "@/lib/billing";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
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
            <div>
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
                <svg className="h-4" viewBox="0 0 468 222" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M414 113.4c0-25.6-12.4-45.8-36.1-45.8-23.8 0-38.2 20.2-38.2 45.6 0 30.1 17 45.3 41.4 45.3 11.9 0 20.9-2.7 27.7-6.5V136c-6.8 3.4-14.6 5.5-24.5 5.5-9.7 0-18.3-3.4-19.4-15.2h48.9c0-1.3.2-6.5.2-13.9zm-49.4-9.5c0-11.3 6.9-16 13.2-16 6.1 0 12.6 4.7 12.6 16h-25.8z" fill="#635BFF"/>
                  <path d="M301.1 67.6c-9.8 0-16.1 4.6-19.6 7.8l-1.3-6.2h-22v116.6l25-5.3.1-28.3c3.6 2.6 8.9 6.3 17.7 6.3 17.9 0 34.2-14.4 34.2-46.1-.1-29-15.6-44.8-34.1-44.8zm-6 68.9c-5.9 0-9.4-2.1-11.8-4.7l-.1-37.1c2.6-2.9 6.2-4.9 11.9-4.9 9.1 0 15.4 10.2 15.4 23.3 0 13.4-6.2 23.4-15.4 23.4z" fill="#635BFF"/>
                  <path d="M223.3 61.2l25.1-5.4V36.4l-25.1 5.3v19.5z" fill="#635BFF"/>
                  <path d="M223.3 69.3h25.1v87.5h-25.1V69.3z" fill="#635BFF"/>
                  <path d="M196.9 76.7l-1.6-7.4h-21.6v87.5h25V97.5l15.1 59.3h29.1l-19.1-68.9c7.3-4.6 12.6-11.6 12.6-20.9 0-11.3-7.1-17.8-17.2-17.8-8.9 0-16.8 4.1-22.3 9.3z" fill="#635BFF"/>
                  <path d="M146.9 47.6l-24.4 5.2-.1 80.1c0 14.8 11.1 25.7 25.9 25.7 8.2 0 14.2-1.5 17.5-3.3V135c-3.2 1.3-19 5.9-19-8.9V90.6h19V69.3h-19V47.6z" fill="#635BFF"/>
                  <path d="M79.3 94.7c0-3.9 3.2-5.4 8.5-5.4 7.6 0 17.2 2.3 24.8 6.4V72.2c-8.3-3.3-16.5-4.6-24.8-4.6C67.5 67.6 54 78.2 54 95.9c0 27.6 38 23.2 38 35.1 0 4.6-4 6.1-9.6 6.1-8.3 0-18.9-3.4-27.3-8v23.8c9.3 4 18.7 5.7 27.3 5.7 20.8 0 35.1-10.3 35.1-28.2-.1-29.8-38.2-25.6-38.2-35.7z" fill="#635BFF"/>
                </svg>
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


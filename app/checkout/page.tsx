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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/get-credits" className="text-muted-foreground hover:text-foreground">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Subscription Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">
                Subscribe to {plan.label}
              </h1>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold">
                    {isTrial ? "$0.49" : `$${plan.price.toFixed(2)}`}
                  </span>
                  {isTrial ? (
                    <span className="text-muted-foreground">today</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {plan.billingPeriod === "week" ? "per week" : "per year"}
                    </span>
                  )}
                </div>
                {isTrial && (
                  <div className="mt-2 text-muted-foreground">
                    Then ${weeklyPlan.price.toFixed(2)} per week starting in 3 days
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-3">
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
              <h2 className="text-xl font-semibold mb-6">Pay with card</h2>
              <CustomCheckout planType={planType} userEmail={user.email || undefined} />
            </div>

            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                By confirming your subscription, you allow PetGroove to charge your card for this payment and future payments in accordance with our terms.
              </p>
              <div className="flex items-center gap-4 pt-4 border-t">
                <span>Powered by</span>
                <svg className="h-4" viewBox="0 0 113 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30.5 15C30.5 23.0081 24.0081 29.5 16 29.5C7.99187 29.5 1.5 23.0081 1.5 15C1.5 6.99187 7.99187 0.5 16 0.5C24.0081 0.5 30.5 6.99187 30.5 15Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 8.5V15L20.5 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="ml-auto">Terms</span>
                <span>Privacy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


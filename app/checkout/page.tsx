import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import { PLANS } from "@/lib/billing";
import CheckoutClientWrapper from "./client-wrapper";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-[40px] overflow-hidden w-full max-w-full overflow-x-hidden">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full">
          <CheckoutClientWrapper planType={planType} userEmail={user.email || undefined} />
        </div>
      </div>
    </div>
  );
}


import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CustomCheckout from "@/components/subscription/CustomCheckout";
import { PLANS } from "@/lib/billing";

type PlanType = "TRIAL" | "WEEKLY" | "ANNUAL";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const supabase = createServerComponentClient({ cookies });
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {plan.label}
          </h1>
          <p className="text-muted-foreground">
            Complete your subscription to get started
          </p>
        </div>

        <div className="glass-panel p-8">
          <CustomCheckout planType={planType} />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}


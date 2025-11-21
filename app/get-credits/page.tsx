import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/types/supabase";
import SubscriptionPage from "@/components/subscription/SubscriptionPage";

export const dynamic = "force-dynamic";

export default async function GetCreditsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Check if user has already used the trial
  const { data: creditsData } = await supabase
    .from("credits")
    .select("has_used_trial")
    .eq("user_id", user.id)
    .single();

  const hasUsedTrial = creditsData?.has_used_trial ?? false;

  return <SubscriptionPage user={user} hasUsedTrial={hasUsedTrial} />;
}

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

  return <SubscriptionPage user={user} />;
}

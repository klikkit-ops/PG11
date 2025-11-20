"use client";

import { Database } from "@/types/supabase";
import { creditsRow } from "@/types/utils";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const revalidate = 0;

type ClientSideCreditsProps = {
  creditsRow: creditsRow | null;
};

import Link from "next/link";
import { Coins } from "lucide-react";

export default function ClientSideCredits({
  creditsRow,
}: ClientSideCreditsProps) {

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
  const [credits, setCredits] = useState<creditsRow | null>(creditsRow);

  useEffect(() => {
    const channel = supabase
      .channel("realtime credits")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "credits" },
        (payload: { new: creditsRow }) => {
          setCredits(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, setCredits]);

  const creditCount = credits?.credits ?? 0;

  return (
    <Link href="/get-credits">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-sm font-medium transition-colors border border-primary/20 cursor-pointer whitespace-nowrap">
        <Coins className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="whitespace-nowrap">Credits: {creditCount}</span>
      </div>
    </Link>
  );
}

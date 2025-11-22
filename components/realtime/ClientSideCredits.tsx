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
import Image from "next/image";

export default function ClientSideCredits({
  creditsRow,
}: ClientSideCreditsProps) {

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
  const [credits, setCredits] = useState<creditsRow | null>(creditsRow);

  // Get user_id from the initial creditsRow
  const userId = creditsRow?.user_id;

  useEffect(() => {
    // Only subscribe if we have a user_id
    if (!userId) {
      return;
    }

    // Create a unique channel name per user to avoid conflicts
    const channelName = `realtime-credits-${userId}`;
    
    // Use type assertion to work around TypeScript inference issue
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "credits"
        } as any,
        (payload: { new: creditsRow; old: creditsRow }) => {
          // Only update if this is for the current user
          if (payload.new.user_id === userId) {
            console.log("[ClientSideCredits] Credits updated:", payload.new.credits);
            setCredits(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[ClientSideCredits] Subscribed to credits updates for user:", userId);
        }
      });

    return () => {
      console.log("[ClientSideCredits] Unsubscribing from credits updates");
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const creditCount = credits?.credits ?? 0;

  return (
    <Link href="/get-credits">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-sm font-medium transition-colors border border-primary/20 cursor-pointer whitespace-nowrap">
        <Image
          src="/coin-icon.png"
          alt="Credit"
          width={16}
          height={16}
          className="flex-shrink-0"
        />
        <span className="whitespace-nowrap">Coins: {creditCount}</span>
      </div>
    </Link>
  );
}

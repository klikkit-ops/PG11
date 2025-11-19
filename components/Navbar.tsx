import { AvatarIcon } from "@radix-ui/react-icons";
import { Camera } from "lucide-react"
import Image from "next/image";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { Button } from "./ui/button";
import React from "react";
import { Database } from "@/types/supabase";
import ClientSideCredits from "./realtime/ClientSideCredits";
import { ThemeToggle } from "./homepage/theme-toggle";

export const dynamic = "force-dynamic";

const stripeIsConfigured = process.env.NEXT_PUBLIC_STRIPE_IS_ENABLED === "true";
export const revalidate = 0;

export default async function Navbar() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: credits } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .single();

  return (
    <header className="sticky top-4 z-[100] w-full px-4">
      <div className="container flex h-16 items-center justify-between rounded-full px-6 mx-auto backdrop-blur-md border border-white/20 shadow-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-blue-500/30 transition-all duration-300">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20">
            <Image
              src="/logo.png"
              alt="PetGroove Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">PetGroove</span>
        </Link>

        {user && (
          <nav className="hidden md:flex gap-6">
            <Link href="/overview/videos" className="text-sm font-medium hover:text-primary transition-colors">
              Videos
            </Link>
            <Link href="/overview/videos/generate" className="text-sm font-medium hover:text-primary transition-colors">
              Create Video
            </Link>
            {stripeIsConfigured && (
              <Link href="/get-credits" className="text-sm font-medium hover:text-primary transition-colors">
                Get Credits
              </Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {!user && (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-medium hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/login">
                <Button variant="gradient">Create Videos</Button>
              </Link>
            </>
          )}

          {user && (
            <div className="flex items-center gap-4">
              {stripeIsConfigured && (
                <ClientSideCredits creditsRow={credits ? credits : null} />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-full border border-border/50">
                    <AvatarIcon className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 z-[101] glass-panel border-0">
                  <DropdownMenuLabel className="text-primary text-center overflow-hidden text-ellipsis">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <form action="/auth/sign-out" method="post">
                    <Button
                      type="submit"
                      className="w-full text-left hover:bg-primary/10 hover:text-primary"
                      variant="ghost"
                    >
                      Log out
                    </Button>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

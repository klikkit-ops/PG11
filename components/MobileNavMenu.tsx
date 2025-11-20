"use client";

import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";

interface MobileNavMenuProps {
  user: { id: string; email?: string | null };
  stripeIsConfigured: boolean;
}

export default function MobileNavMenu({ user, stripeIsConfigured }: MobileNavMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-full border border-border/50 md:hidden">
          <Menu className="h-5 w-5 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 z-[101] glass-panel border-0 md:hidden">
        <DropdownMenuItem asChild>
          <Link href="/overview/videos" className="cursor-pointer">
            Videos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/overview/videos/generate" className="cursor-pointer">
            Create Video
          </Link>
        </DropdownMenuItem>
        {stripeIsConfigured && (
          <DropdownMenuItem asChild>
            <Link href="/get-credits" className="cursor-pointer">
              Get Credits
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


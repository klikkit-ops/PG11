"use client";

import { usePathname } from "next/navigation";
import { PetAvatar } from "@/components/ui/pet-avatar";

export function MobileAvatars() {
    const pathname = usePathname();

    // Don't show on landing page
    if (pathname === "/") {
        return null;
    }

    return (
        <>
            <PetAvatar
                petId={1}
                size="sm"
                style={{ position: 'absolute', bottom: '1rem', right: '-1rem', transform: 'rotate(-10deg)', zIndex: 40 }}
                className="block md:hidden pointer-events-none opacity-80"
            />
            <PetAvatar
                petId={3}
                size="sm"
                style={{ position: 'absolute', top: '15%', left: '-1.5rem', transform: 'rotate(10deg)', zIndex: 40 }}
                className="block md:hidden pointer-events-none opacity-80"
            />
        </>
    );
}

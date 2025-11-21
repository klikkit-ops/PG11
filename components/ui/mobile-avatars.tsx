"use client";

import { usePathname } from "next/navigation";
import { PetAvatar } from "@/components/ui/pet-avatar";

export function MobileAvatars() {
    const pathname = usePathname();

    // Don't show on landing page, video pages, or get-credits page
    if (pathname === "/" || pathname?.startsWith("/overview/videos") || pathname === "/get-credits") {
        return null;
    }

    const isCheckoutPage = pathname === "/checkout";

    return (
        <>
            <PetAvatar
                petId={1}
                size="sm"
                style={{ 
                    position: 'absolute', 
                    ...(isCheckoutPage ? { top: '25rem', right: '0rem' } : { bottom: '1rem', right: '-1rem' }), 
                    transform: isCheckoutPage ? 'rotate(-10deg) scale(1.5)' : 'rotate(-10deg)', 
                    zIndex: 40 
                }}
                className="block md:hidden pointer-events-none opacity-80"
            />
            {!isCheckoutPage && (
                <PetAvatar
                    petId={3}
                    size="sm"
                    style={{ position: 'absolute', top: '15%', left: '-1.5rem', transform: 'rotate(10deg)', zIndex: 40 }}
                    className="block md:hidden pointer-events-none opacity-80"
                />
            )}
        </>
    );
}

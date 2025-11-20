import Image from "next/image";
import { cn } from "@/lib/utils";

type PetAvatarProps = {
    index: 1 | 2 | 3 | 4 | 5;
    className?: string;
    size?: number;
    flip?: boolean;
    animate?: boolean;
};

export function PetAvatar({
    index,
    className,
    size = 150,
    flip = false,
    animate = true
}: PetAvatarProps) {
    return (
        <div
            className={cn(
                "pointer-events-none select-none absolute z-0",
                animate && "animate-float",
                className
            )}
        >
            <Image
                src={`/avatars/avatar-${index}.png`}
                alt="Pet Avatar"
                width={size}
                height={size}
                className={cn(
                    "h-auto w-auto drop-shadow-xl transition-transform hover:scale-110 duration-300",
                    flip && "-scale-x-100"
                )}
            />
        </div>
    );
}

import Image from "next/image";

type PetAvatarProps = {
    petId: 1 | 2 | 3 | 4 | 5;
    size?: "sm" | "md" | "lg";
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    className?: string;
};

const sizeClasses = {
    sm: "w-16 h-16 md:w-20 md:h-20",
    md: "w-20 h-20 md:w-28 md:h-28",
    lg: "w-28 h-28 md:w-36 md:h-36",
};

const positionClasses = {
    "top-left": "top-4 left-4 md:top-8 md:left-8",
    "top-right": "top-4 right-4 md:top-8 md:right-8",
    "bottom-left": "bottom-4 left-4 md:bottom-8 md:left-8",
    "bottom-right": "bottom-4 right-4 md:bottom-8 md:right-8",
};

export function PetAvatar({
    petId,
    size = "md",
    position,
    className = "",
}: PetAvatarProps) {
    const baseClasses = position
        ? `absolute ${positionClasses[position]} pointer-events-none select-none`
        : "pointer-events-none select-none";

    return (
        <div
            className={`${baseClasses} ${sizeClasses[size]} ${className} opacity-80 hover:opacity-100 transition-opacity duration-300 z-0`}
        >
            <Image
                src={`/avatars/pet-${petId}.png`}
                alt="Dancing pet mascot"
                fill
                className="object-contain drop-shadow-lg"
            />
        </div>
    );
}

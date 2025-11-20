import Image from "next/image";

type PetAvatarProps = {
    petId: 1 | 2 | 3 | 4 | 5;
    size?: "sm" | "md" | "lg";
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    className?: string;
};

const sizeClasses = {
    sm: "w-32 h-32 md:w-40 md:h-40",
    md: "w-40 h-40 md:w-52 md:h-52",
    lg: "w-52 h-52 md:w-64 md:h-64",
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
            className={`${baseClasses} ${sizeClasses[size]} ${className} opacity-90 hover:opacity-100 transition-opacity duration-300 z-10`}
        >
            <Image
                src={`/avatars/pet-${petId}.png`}
                alt="Dancing pet mascot"
                fill
                className="object-contain drop-shadow-2xl"
            />
        </div>
    );
}

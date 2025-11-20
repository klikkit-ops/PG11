import Image from "next/image";

type PetAvatarProps = {
    petId: 1 | 2 | 3 | 4 | 5;
    size?: "sm" | "md" | "lg";
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    className?: string;
    style?: React.CSSProperties;
};

const sizeClasses = {
    sm: "w-48 h-48 md:w-60 md:h-60",
    md: "w-60 h-60 md:w-80 md:h-80",
    lg: "w-80 h-80 md:w-96 md:h-96",
};

const positionClasses = {
    "top-left": "top-16 left-8 md:top-20 md:left-16 lg:left-24",
    "top-right": "top-16 right-8 md:top-20 md:right-16 lg:right-24",
    "bottom-left": "bottom-16 left-8 md:bottom-20 md:left-16 lg:left-24",
    "bottom-right": "bottom-16 right-8 md:bottom-20 md:right-16 lg:right-24",
};

export function PetAvatar({
    petId,
    size = "md",
    position,
    className = "",
    style,
}: PetAvatarProps) {
    const baseClasses = position
        ? `absolute ${positionClasses[position]} pointer-events-none select-none`
        : "absolute pointer-events-none select-none";

    return (
        <div
            className={`${baseClasses} ${sizeClasses[size]} ${className} opacity-90 hover:opacity-100 transition-opacity duration-300 z-10`}
            style={style}
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

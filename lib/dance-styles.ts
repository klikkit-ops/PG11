/**
 * Dance styles available for pet video generation
 */

export interface DanceStyle {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const DANCE_STYLES: DanceStyle[] = [
  {
    id: "macarena",
    name: "Macarena",
    description: "Classic 90s dance with coordinated arm movements",
    emoji: "💃",
  },
  {
    id: "salsa",
    name: "Salsa",
    description: "Smooth, rhythmic Latin dance with graceful turns",
    emoji: "🌶️",
  },
  {
    id: "hip_hop",
    name: "Hip Hop",
    description: "Energetic street dance with sharp moves",
    emoji: "🎤",
  },
  {
    id: "robot",
    name: "Robot",
    description: "Mechanical dance with staccato movements",
    emoji: "🤖",
  },
  {
    id: "ballet",
    name: "Ballet",
    description: "Elegant and graceful classical dance",
    emoji: "🩰",
  },
  {
    id: "disco",
    name: "Disco",
    description: "Groovy 70s dance with funky style",
    emoji: "🕺",
  },
  {
    id: "breakdance",
    name: "Breakdance",
    description: "Dynamic floor movements with spins and freezes",
    emoji: "🔄",
  },
  {
    id: "waltz",
    name: "Waltz",
    description: "Smooth, flowing dance in 3/4 time",
    emoji: "💫",
  },
  {
    id: "tango",
    name: "Tango",
    description: "Dramatic and passionate dance",
    emoji: "🔥",
  },
  {
    id: "cha_cha",
    name: "Cha Cha",
    description: "Quick, rhythmic Latin dance steps",
    emoji: "🎵",
  },
];

export function getDanceStyleById(id: string): DanceStyle | undefined {
  return DANCE_STYLES.find((style) => style.id === id);
}

export function getDanceStyleByName(name: string): DanceStyle | undefined {
  return DANCE_STYLES.find(
    (style) => style.name.toLowerCase() === name.toLowerCase()
  );
}


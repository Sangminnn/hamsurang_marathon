export type CharacterId = "surangi" | "turtle";
export type HatId = "none" | "cap" | "crown" | "leaf" | "visor";
export type TrailId = "mint" | "spark" | "flame" | "petal";

export type CosmeticProfile = {
  preferredName: string;
  coins: number;
  equippedHat: HatId;
  equippedTrail: TrailId;
  unlockedHats: HatId[];
  unlockedTrails: TrailId[];
};

export const CHARACTERS: Record<CharacterId, { label: string; emoji: string; imagePath: string; sceneKey: string }> = {
  surangi: {
    label: "수랑이",
    emoji: "🤍",
    imagePath: "/assets/characters/hamsurang_surang.png",
    sceneKey: "character-surangi",
  },
  turtle: {
    label: "거북이",
    emoji: "🐢",
    imagePath: "/assets/characters/hamsurang_turtle.png",
    sceneKey: "character-turtle",
  },
};

export const HATS: Array<{
  id: HatId;
  label: string;
  emoji: string;
  price: number;
}> = [
  { id: "none", label: "기본", emoji: "▫️", price: 0 },
  { id: "cap", label: "캡", emoji: "🧢", price: 0 },
  { id: "crown", label: "왕관", emoji: "👑", price: 120 },
  { id: "leaf", label: "리프", emoji: "🍃", price: 90 },
  { id: "visor", label: "바이저", emoji: "🥽", price: 140 },
];

export const TRAILS: Array<{
  id: TrailId;
  label: string;
  emoji: string;
  price: number;
  color: number;
}> = [
  { id: "mint", label: "민트", emoji: "💨", price: 0, color: 0x72c8a1 },
  { id: "spark", label: "스파크", emoji: "✨", price: 110, color: 0xffd96a },
  { id: "flame", label: "플레임", emoji: "🔥", price: 150, color: 0xff7b54 },
  { id: "petal", label: "페탈", emoji: "🌸", price: 130, color: 0xf49ac2 },
];

export const DEFAULT_PROFILE: CosmeticProfile = {
  preferredName: "",
  coins: 180,
  equippedHat: "cap",
  equippedTrail: "mint",
  unlockedHats: ["none", "cap"],
  unlockedTrails: ["mint"],
};

export function getRaceReward(place: number) {
  if (place === 1) {
    return 120;
  }

  if (place === 2) {
    return 90;
  }

  if (place === 3) {
    return 70;
  }

  return 50;
}

export function getHatMeta(hatId: HatId) {
  return HATS.find((hat) => hat.id === hatId) ?? HATS[0];
}

export function getTrailMeta(trailId: TrailId) {
  return TRAILS.find((trail) => trail.id === trailId) ?? TRAILS[0];
}

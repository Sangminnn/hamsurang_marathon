export type CharacterId = "surangi" | "turtle";
export type SkinId =
  | "surangi-classic"
  | "surangi-cheer"
  | "surangi-breeze"
  | "turtle-classic"
  | "turtle-coder"
  | "turtle-sprint";
export type HatId = "none" | "cap" | "crown" | "leaf" | "visor";
export type TrailId = "mint" | "spark" | "flame" | "petal";

export type CosmeticProfile = {
  preferredName: string;
  coins: number;
  equippedSkin: SkinId;
  equippedHat: HatId;
  equippedTrail: TrailId;
  unlockedSkins: SkinId[];
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

export const SKINS: Array<{
  id: SkinId;
  characterId: CharacterId;
  label: string;
  subtitle: string;
  price: number;
  tint: number;
  accentColor: string;
  badge: string;
}> = [
  {
    id: "surangi-classic",
    characterId: "surangi",
    label: "수랑이 기본",
    subtitle: "포근한 기본 실루엣",
    price: 0,
    tint: 0xffffff,
    accentColor: "#f3a68f",
    badge: "기본",
  },
  {
    id: "surangi-cheer",
    characterId: "surangi",
    label: "응원단 수랑이",
    subtitle: "하트 응원 효과가 강조된 스킨",
    price: 180,
    tint: 0xffd7de,
    accentColor: "#f47f97",
    badge: "인기",
  },
  {
    id: "surangi-breeze",
    characterId: "surangi",
    label: "민트 브리즈 수랑이",
    subtitle: "모자 톤과 잘 맞는 시원한 컬러감",
    price: 210,
    tint: 0xdff8ea,
    accentColor: "#52b788",
    badge: "희귀",
  },
  {
    id: "turtle-classic",
    characterId: "turtle",
    label: "거북이 기본",
    subtitle: "기본 러너 포즈",
    price: 0,
    tint: 0xffffff,
    accentColor: "#8ea99b",
    badge: "기본",
  },
  {
    id: "turtle-coder",
    characterId: "turtle",
    label: "코더 거북이",
    subtitle: "노트북 러너 콘셉트",
    price: 190,
    tint: 0xdcecff,
    accentColor: "#6b9ac4",
    badge: "시그니처",
  },
  {
    id: "turtle-sprint",
    characterId: "turtle",
    label: "스프린트 거북이",
    subtitle: "트랙 위 경쟁형 컬러 베리에이션",
    price: 220,
    tint: 0xe9f7d7,
    accentColor: "#7ab648",
    badge: "신규",
  },
];

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
  equippedSkin: "surangi-classic",
  equippedHat: "cap",
  equippedTrail: "mint",
  unlockedSkins: ["surangi-classic", "turtle-classic"],
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

export function getSkinMeta(skinId: SkinId) {
  return SKINS.find((skin) => skin.id === skinId) ?? SKINS[0];
}

export function getCharacterSkins(characterId: CharacterId) {
  return SKINS.filter((skin) => skin.characterId === characterId);
}

export function getDefaultSkinForCharacter(characterId: CharacterId): SkinId {
  return characterId === "turtle" ? "turtle-classic" : "surangi-classic";
}

export function getTrailMeta(trailId: TrailId) {
  return TRAILS.find((trail) => trail.id === trailId) ?? TRAILS[0];
}

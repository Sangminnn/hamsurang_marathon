export type CharacterId = "surangi" | "turtle";
export type SkinId =
  | "surangi-classic"
  | "surangi-detective"
  | "surangi-rainbow"
  | "surangi-mechanic"
  | "surangi-sun"
  | "surangi-skater"
  | "surangi-snack"
  | "surangi-soccer"
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

export type ArtSource =
  | {
      kind: "image";
      imagePath: string;
    }
  | {
      kind: "sheet";
      imagePath: string;
      crop: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      sheetWidth: number;
      sheetHeight: number;
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

const SURANG_IMAGESET_PATH = "/assets/characters/surang_imageset.png";
const SURANG_CELL_SIZE = 299;

function getSurangSheetArt(column: number, row = 0): ArtSource {
  return {
    kind: "sheet",
    imagePath: SURANG_IMAGESET_PATH,
    crop: {
      x: column * SURANG_CELL_SIZE,
      y: row * SURANG_CELL_SIZE,
      width: SURANG_CELL_SIZE,
      height: SURANG_CELL_SIZE,
    },
    sheetWidth: 2392,
    sheetHeight: 1792,
  };
}

export const SKINS: Array<{
  id: SkinId;
  characterId: CharacterId;
  label: string;
  subtitle: string;
  price: number;
  tint: number;
  accentColor: string;
  badge: string;
  art: ArtSource;
}> = [
  {
    id: "surangi-classic",
    characterId: "surangi",
    label: "캡 수랑이",
    subtitle: "대표 메인 캐릭터",
    price: 0,
    tint: 0xffffff,
    accentColor: "#f3a68f",
    badge: "기본",
    art: getSurangSheetArt(0, 0),
  },
  {
    id: "surangi-detective",
    characterId: "surangi",
    label: "탐정 수랑이",
    subtitle: "코트와 모자가 강조된 수집형 캐릭터",
    price: 150,
    tint: 0xffffff,
    accentColor: "#5f84c9",
    badge: "인기",
    art: getSurangSheetArt(1, 0),
  },
  {
    id: "surangi-rainbow",
    characterId: "surangi",
    label: "레인보우 수랑이",
    subtitle: "비비드한 비니 포인트가 살아 있는 캐릭터",
    price: 190,
    tint: 0xffffff,
    accentColor: "#d96fd6",
    badge: "인기",
    art: getSurangSheetArt(2, 0),
  },
  {
    id: "surangi-mechanic",
    characterId: "surangi",
    label: "메카닉 수랑이",
    subtitle: "툴 벨트 콘셉트의 경쟁형 캐릭터",
    price: 210,
    tint: 0xffffff,
    accentColor: "#646b75",
    badge: "희귀",
    art: getSurangSheetArt(3, 0),
  },
  {
    id: "surangi-sun",
    characterId: "surangi",
    label: "선샤인 수랑이",
    subtitle: "밝은 톤과 선글라스로 존재감이 큰 캐릭터",
    price: 170,
    tint: 0xffffff,
    accentColor: "#f1b93a",
    badge: "신규",
    art: getSurangSheetArt(4, 0),
  },
  {
    id: "surangi-skater",
    characterId: "surangi",
    label: "스케이터 수랑이",
    subtitle: "보드를 탄 액티브 무드 캐릭터",
    price: 200,
    tint: 0xffffff,
    accentColor: "#ef8a3b",
    badge: "시그니처",
    art: getSurangSheetArt(5, 0),
  },
  {
    id: "surangi-snack",
    characterId: "surangi",
    label: "낙서 수랑이",
    subtitle: "간식과 함께하는 캐주얼 캐릭터",
    price: 140,
    tint: 0xffffff,
    accentColor: "#8f8f8f",
    badge: "한정",
    art: getSurangSheetArt(6, 0),
  },
  {
    id: "surangi-soccer",
    characterId: "surangi",
    label: "사커 수랑이",
    subtitle: "경기장 감성의 스포츠 캐릭터",
    price: 160,
    tint: 0xffffff,
    accentColor: "#d69d34",
    badge: "희귀",
    art: getSurangSheetArt(7, 0),
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/hamsurang_turtle.png",
    },
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/hamsurang_turtle.png",
    },
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/hamsurang_turtle.png",
    },
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

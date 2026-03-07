export type CharacterId = "surangi" | "turtle";
export type SkinId =
  | "surangi-classic"
  | "surangi-detective"
  | "surangi-rainbow"
  | "surangi-mechanic"
  | "surangi-sun"
  | "surangi-skater"
  | "surangi-explorer"
  | "surangi-farmer"
  | "surangi-diver"
  | "surangi-blossom"
  | "surangi-headset"
  | "surangi-dj"
  | "surangi-chef"
  | "surangi-astronaut"
  | "surangi-runner"
  | "surangi-winter"
  | "surangi-pilot"
  | "surangi-banker"
  | "surangi-cadet"
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-classic.png",
    },
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-detective.png",
    },
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-rainbow.png",
    },
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-mechanic.png",
    },
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-sun.png",
    },
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
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-skater.png",
    },
  },
  {
    id: "surangi-explorer",
    characterId: "surangi",
    label: "익스플로러 수랑이",
    subtitle: "장비를 챙긴 탐험형 캐릭터",
    price: 180,
    tint: 0xffffff,
    accentColor: "#5f9a86",
    badge: "신규",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-explorer.png",
    },
  },
  {
    id: "surangi-farmer",
    characterId: "surangi",
    label: "파머 수랑이",
    subtitle: "정원과 모자를 갖춘 힐링형 캐릭터",
    price: 160,
    tint: 0xffffff,
    accentColor: "#7ea45a",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-farmer.png",
    },
  },
  {
    id: "surangi-diver",
    characterId: "surangi",
    label: "다이버 수랑이",
    subtitle: "깊은 바다 콘셉트의 잠수복 캐릭터",
    price: 220,
    tint: 0xffffff,
    accentColor: "#e28a2a",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-diver.png",
    },
  },
  {
    id: "surangi-blossom",
    characterId: "surangi",
    label: "블라썸 수랑이",
    subtitle: "꽃 장식이 포인트인 감성 캐릭터",
    price: 170,
    tint: 0xffffff,
    accentColor: "#d5798c",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-blossom.png",
    },
  },
  {
    id: "surangi-headset",
    characterId: "surangi",
    label: "헤드셋 수랑이",
    subtitle: "라이브 방송 감성의 퍼포머 캐릭터",
    price: 180,
    tint: 0xffffff,
    accentColor: "#9a82d8",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-headset.png",
    },
  },
  {
    id: "surangi-dj",
    characterId: "surangi",
    label: "DJ 수랑이",
    subtitle: "콘솔과 함께 등장하는 스테이지 캐릭터",
    price: 230,
    tint: 0xffffff,
    accentColor: "#a06cd5",
    badge: "시그니처",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-dj.png",
    },
  },
  {
    id: "surangi-chef",
    characterId: "surangi",
    label: "셰프 수랑이",
    subtitle: "앞치마와 모자가 귀여운 키친 캐릭터",
    price: 185,
    tint: 0xffffff,
    accentColor: "#d96c63",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-chef.png",
    },
  },
  {
    id: "surangi-astronaut",
    characterId: "surangi",
    label: "우주비행사 수랑이",
    subtitle: "우주복과 헬멧이 강조된 탐험 캐릭터",
    price: 240,
    tint: 0xffffff,
    accentColor: "#7f90d4",
    badge: "전설",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-astronaut.png",
    },
  },
  {
    id: "surangi-runner",
    characterId: "surangi",
    label: "러너 수랑이",
    subtitle: "이어폰과 조끼를 갖춘 마라톤 캐릭터",
    price: 195,
    tint: 0xffffff,
    accentColor: "#f08f4e",
    badge: "신규",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-runner.png",
    },
  },
  {
    id: "surangi-winter",
    characterId: "surangi",
    label: "윈터 수랑이",
    subtitle: "패딩과 비니가 포근한 겨울 캐릭터",
    price: 205,
    tint: 0xffffff,
    accentColor: "#85c7d4",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-winter.png",
    },
  },
  {
    id: "surangi-pilot",
    characterId: "surangi",
    label: "파일럿 수랑이",
    subtitle: "유니폼이 돋보이는 항공 캐릭터",
    price: 210,
    tint: 0xffffff,
    accentColor: "#4b6cb7",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-pilot.png",
    },
  },
  {
    id: "surangi-banker",
    characterId: "surangi",
    label: "뱅커 수랑이",
    subtitle: "브리프케이스를 든 비즈니스 캐릭터",
    price: 210,
    tint: 0xffffff,
    accentColor: "#816b4a",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-banker.png",
    },
  },
  {
    id: "surangi-cadet",
    characterId: "surangi",
    label: "캐딧 수랑이",
    subtitle: "교복 느낌의 단정한 캐릭터",
    price: 200,
    tint: 0xffffff,
    accentColor: "#d6a13d",
    badge: "신규",
    art: {
      kind: "image",
      imagePath: "/assets/characters/surang_roster/surangi-cadet.png",
    },
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

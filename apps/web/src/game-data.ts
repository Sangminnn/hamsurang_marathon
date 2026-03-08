export type CharacterId = "surangi" | "turtle";
export type SkinId = string;
export type TrailId = "mint" | "spark" | "flame" | "petal";

export type CosmeticProfile = {
  preferredName: string;
  coins: number;
  equippedSkin: SkinId;
  equippedTrail: TrailId;
  unlockedSkins: SkinId[];
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

const SURANG_SHEET_PATH = "/assets/characters/surang_only_remove_bg-Photoroom.png";
const SURANG_SOURCE_WIDTH = 2292;
const SURANG_SOURCE_HEIGHT = 874;
const SURANG_SHEET_WIDTH = 1280;
const SURANG_SHEET_HEIGHT = 488;
const HAMBUGI_SHEET_PATH = "/assets/characters/hambugi_remove_bg-Photoroom.png";
const HAMBUGI_SOURCE_WIDTH = 2274;
const HAMBUGI_SOURCE_HEIGHT = 866;
const HAMBUGI_SHEET_WIDTH = 1280;
const HAMBUGI_SHEET_HEIGHT = 487;

function surangSheetCrop(x: number, y: number, width: number, height: number): ArtSource {
  const scaleX = SURANG_SHEET_WIDTH / SURANG_SOURCE_WIDTH;
  const scaleY = SURANG_SHEET_HEIGHT / SURANG_SOURCE_HEIGHT;
  return {
    kind: "sheet",
    imagePath: SURANG_SHEET_PATH,
    crop: {
      x: Math.round(x * scaleX),
      y: Math.round(y * scaleY),
      width: Math.round(width * scaleX),
      height: Math.round(height * scaleY),
    },
    sheetWidth: SURANG_SHEET_WIDTH,
    sheetHeight: SURANG_SHEET_HEIGHT,
  };
}

function hambugiSheetCrop(x: number, y: number, width: number, height: number): ArtSource {
  const scaleX = HAMBUGI_SHEET_WIDTH / HAMBUGI_SOURCE_WIDTH;
  const scaleY = HAMBUGI_SHEET_HEIGHT / HAMBUGI_SOURCE_HEIGHT;
  return {
    kind: "sheet",
    imagePath: HAMBUGI_SHEET_PATH,
    crop: {
      x: Math.round(x * scaleX),
      y: Math.round(y * scaleY),
      width: Math.round(width * scaleX),
      height: Math.round(height * scaleY),
    },
    sheetWidth: HAMBUGI_SHEET_WIDTH,
    sheetHeight: HAMBUGI_SHEET_HEIGHT,
  };
}

function imageCrop(imagePath: string, x: number, y: number, width: number, height: number, sourceSize = 360): ArtSource {
  return {
    kind: "sheet",
    imagePath,
    crop: { x, y, width, height },
    sheetWidth: sourceSize,
    sheetHeight: sourceSize,
  };
}

export const CHARACTERS: Record<CharacterId, { label: string; emoji: string; imagePath: string; sceneKey: string }> = {
  surangi: {
    label: "수랑이",
    emoji: "🤍",
    imagePath: SURANG_SHEET_PATH,
    sceneKey: "character-surangi",
  },
  turtle: {
    label: "함부기",
    emoji: "🐢",
    imagePath: HAMBUGI_SHEET_PATH,
    sceneKey: "character-turtle",
  },
};

export const PLAYABLE_CHARACTER_IDS = ["surangi"] as const;
export const PLAYABLE_CHARACTERS = PLAYABLE_CHARACTER_IDS.map((characterId) => ({
  id: characterId,
  ...CHARACTERS[characterId],
}));

const BASE_SKINS: Array<{
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
    art: surangSheetCrop(0, 0, 300, 292),
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
    art: surangSheetCrop(280, 0, 310, 292),
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
    art: surangSheetCrop(560, 0, 320, 292),
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
    art: surangSheetCrop(850, 0, 320, 292),
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
    art: surangSheetCrop(1450, 10, 240, 280),
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
    art: surangSheetCrop(8, 315, 280, 270),
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
    art: surangSheetCrop(280, 290, 330, 320),
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
    art: surangSheetCrop(635, 308, 255, 285),
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
    art: surangSheetCrop(895, 315, 285, 285),
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
    art: surangSheetCrop(1190, 315, 245, 270),
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
    art: surangSheetCrop(2028, 315, 240, 270),
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
    art: surangSheetCrop(305, 610, 220, 255),
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
    art: surangSheetCrop(635, 612, 220, 270),
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
    art: surangSheetCrop(892, 606, 275, 270),
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
    art: surangSheetCrop(1190, 610, 260, 268),
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
    art: surangSheetCrop(1450, 580, 260, 294),
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
    art: surangSheetCrop(1715, 580, 285, 294),
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
    art: surangSheetCrop(2028, 610, 245, 268),
  },
  {
    id: "turtle-classic",
    characterId: "turtle",
    label: "함부기",
    subtitle: "멀티 모니터 앞에 앉은 메인 함부기",
    price: 0,
    tint: 0xffffff,
    accentColor: "#8ea99b",
    badge: "기본",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-hacker.png",
    },
  },
  {
    id: "turtle-coder",
    characterId: "turtle",
    label: "분석가 함부기",
    subtitle: "투명 테이블에서 데이터를 다루는 전략형 함부기",
    price: 190,
    tint: 0xffffff,
    accentColor: "#7db486",
    badge: "시그니처",
    art: imageCrop("/assets/characters/turtle_roster/turtle-analyst.png", 204, 18, 118, 314),
  },
  {
    id: "turtle-sprint",
    characterId: "turtle",
    label: "스트리머 함부기",
    subtitle: "키보드 세팅이 강조된 퍼포먼스형 함부기",
    price: 220,
    tint: 0xffffff,
    accentColor: "#d56d5d",
    badge: "신규",
    art: imageCrop("/assets/characters/turtle_roster/turtle-streamer.png", 224, 18, 102, 318),
  },
  {
    id: "turtle-writer",
    characterId: "turtle",
    label: "작가 함부기",
    subtitle: "깃펜과 책상이 돋보이는 집중형 함부기",
    price: 180,
    tint: 0xffffff,
    accentColor: "#7d8f5b",
    badge: "인기",
    art: hambugiSheetCrop(0, 450, 380, 416),
  },
  {
    id: "turtle-accountant",
    characterId: "turtle",
    label: "정산 함부기",
    subtitle: "계산기와 영수증을 챙긴 재무형 함부기",
    price: 170,
    tint: 0xffffff,
    accentColor: "#d0a33b",
    badge: "희귀",
    art: imageCrop("/assets/characters/turtle_roster/turtle-accountant.png", 132, 18, 172, 314),
  },
  {
    id: "turtle-filmmaker",
    characterId: "turtle",
    label: "필름메이커 함부기",
    subtitle: "카메라 리그를 다루는 제작형 함부기",
    price: 200,
    tint: 0xffffff,
    accentColor: "#8c63c9",
    badge: "신규",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-filmmaker.png",
    },
  },
  {
    id: "turtle-graffiti",
    characterId: "turtle",
    label: "그래피티 함부기",
    subtitle: "벽화와 스프레이 콘셉트의 스트릿 함부기",
    price: 195,
    tint: 0xffffff,
    accentColor: "#59b9b5",
    badge: "인기",
    art: imageCrop("/assets/characters/turtle_roster/turtle-graffiti.png", 88, 30, 156, 300),
  },
  {
    id: "turtle-dj",
    characterId: "turtle",
    label: "DJ 함부기",
    subtitle: "콘솔과 전화기 사이를 오가는 믹서형 함부기",
    price: 230,
    tint: 0xffffff,
    accentColor: "#d78a3d",
    badge: "시그니처",
    art: imageCrop("/assets/characters/turtle_roster/turtle-dj.png", 220, 16, 108, 320),
  },
  {
    id: "turtle-spacewalk",
    characterId: "turtle",
    label: "우주유영 함부기",
    subtitle: "동료와 함께 출격하는 우주 탐사 함부기",
    price: 240,
    tint: 0xffffff,
    accentColor: "#b8bbc9",
    badge: "전설",
    art: imageCrop("/assets/characters/turtle_roster/turtle-spacewalk.png", 30, 12, 118, 324),
  },
  {
    id: "turtle-chef-white",
    characterId: "turtle",
    label: "화이트 셰프 함부기",
    subtitle: "셰프 복장을 갖춘 주방형 함부기",
    price: 185,
    tint: 0xffffff,
    accentColor: "#d2d2d2",
    badge: "인기",
    art: imageCrop("/assets/characters/turtle_roster/turtle-chef-white.png", 176, 10, 148, 326),
  },
  {
    id: "turtle-medalist",
    characterId: "turtle",
    label: "메달리스트 함부기",
    subtitle: "수상 포즈가 강조된 챔피언 함부기",
    price: 210,
    tint: 0xffffff,
    accentColor: "#d3af39",
    badge: "희귀",
    art: imageCrop("/assets/characters/turtle_roster/turtle-medalist.png", 70, 14, 216, 320),
  },
  {
    id: "turtle-firefighter",
    characterId: "turtle",
    label: "소방관 함부기",
    subtitle: "호스를 든 현장형 함부기",
    price: 205,
    tint: 0xffffff,
    accentColor: "#d55a3e",
    badge: "신규",
    art: hambugiSheetCrop(19, 32, 320, 403),
  },
  {
    id: "turtle-diver",
    characterId: "turtle",
    label: "다이버 함부기",
    subtitle: "잠수복과 장비가 완성된 심해 함부기",
    price: 220,
    tint: 0xffffff,
    accentColor: "#d28a2a",
    badge: "희귀",
    art: hambugiSheetCrop(422, 30, 355, 408),
  },
  {
    id: "turtle-rose-agent",
    characterId: "turtle",
    label: "로즈 에이전트 함부기",
    subtitle: "장미와 마스크가 포인트인 미스터리 함부기",
    price: 215,
    tint: 0xffffff,
    accentColor: "#5a5a5a",
    badge: "희귀",
    art: hambugiSheetCrop(816, 204, 330, 232),
  },
  {
    id: "turtle-gardener",
    characterId: "turtle",
    label: "가드너 함부기",
    subtitle: "물뿌리개를 든 정원형 함부기",
    price: 170,
    tint: 0xffffff,
    accentColor: "#79a85a",
    badge: "인기",
    art: hambugiSheetCrop(1168, 172, 288, 264),
  },
  {
    id: "turtle-builder",
    characterId: "turtle",
    label: "빌더 함부기",
    subtitle: "망치와 공구 벨트를 장착한 함부기",
    price: 200,
    tint: 0xffffff,
    accentColor: "#58b4b4",
    badge: "신규",
    art: hambugiSheetCrop(1532, 47, 350, 386),
  },
  {
    id: "turtle-headset",
    characterId: "turtle",
    label: "헤드셋 함부기",
    subtitle: "오퍼레이터 감성의 퍼포먼스 함부기",
    price: 190,
    tint: 0xffffff,
    accentColor: "#8d6ac6",
    badge: "인기",
    art: hambugiSheetCrop(1913, 33, 351, 402),
  },
  {
    id: "turtle-scholar",
    characterId: "turtle",
    label: "학자 함부기",
    subtitle: "책상과 깃펜이 어울리는 연구형 함부기",
    price: 175,
    tint: 0xffffff,
    accentColor: "#7d7b61",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-scholar.png",
    },
  },
  {
    id: "turtle-architect",
    characterId: "turtle",
    label: "설계사 함부기",
    subtitle: "블록 설계를 하는 전략형 함부기",
    price: 180,
    tint: 0xffffff,
    accentColor: "#7da85f",
    badge: "인기",
    art: hambugiSheetCrop(408, 487, 372, 362),
  },
  {
    id: "turtle-astronaut",
    characterId: "turtle",
    label: "우주비행사 함부기",
    subtitle: "화이트 수트 버전의 솔로 우주 함부기",
    price: 235,
    tint: 0xffffff,
    accentColor: "#c0c8d9",
    badge: "전설",
    art: hambugiSheetCrop(845, 480, 258, 373),
  },
  {
    id: "turtle-chef-green",
    characterId: "turtle",
    label: "그린 셰프 함부기",
    subtitle: "숟가락을 든 셰프 콘셉트 함부기",
    price: 180,
    tint: 0xffffff,
    accentColor: "#87a860",
    badge: "인기",
    art: hambugiSheetCrop(1199, 470, 264, 379),
  },
  {
    id: "turtle-arcade",
    characterId: "turtle",
    label: "아케이드 함부기",
    subtitle: "게임기 앞에 선 플레이어 함부기",
    price: 205,
    tint: 0xffffff,
    accentColor: "#5c8fc7",
    badge: "시그니처",
    art: hambugiSheetCrop(1539, 485, 356, 327),
  },
  {
    id: "turtle-painter",
    characterId: "turtle",
    label: "페인터 함부기",
    subtitle: "앞치마와 베레모가 포인트인 아티스트 함부기",
    price: 185,
    tint: 0xffffff,
    accentColor: "#78a764",
    badge: "신규",
    art: hambugiSheetCrop(1948, 515, 268, 336),
  },
];

export const PREMIUM_SKIN_IDS = [
  "surangi-diver",
  "surangi-dj",
  "surangi-astronaut",
  "turtle-dj",
  "turtle-spacewalk",
  "turtle-astronaut",
] as const;

const PREMIUM_SKIN_ID_SET = new Set<string>(PREMIUM_SKIN_IDS);

export const SKINS = BASE_SKINS.map((skin) =>
  PREMIUM_SKIN_ID_SET.has(skin.id)
    ? skin
    : {
        ...skin,
        price: 0,
      },
);

export const PLAYABLE_SKINS = SKINS.filter((skin) => skin.characterId === "surangi");
export const FREE_SKIN_IDS = PLAYABLE_SKINS.filter((skin) => skin.price === 0).map((skin) => skin.id);

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
  equippedTrail: "mint",
  unlockedSkins: FREE_SKIN_IDS,
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

export function getSkinMeta(skinId: SkinId) {
  return SKINS.find((skin) => skin.id === skinId) ?? SKINS[0];
}

export function getCharacterSkins(characterId: CharacterId) {
  return characterId === "surangi" ? PLAYABLE_SKINS : [];
}

export function getDefaultSkinForCharacter(characterId: CharacterId): SkinId {
  return characterId === "turtle" ? "turtle-classic" : "surangi-classic";
}

export function getTrailMeta(trailId: TrailId) {
  return TRAILS.find((trail) => trail.id === trailId) ?? TRAILS[0];
}

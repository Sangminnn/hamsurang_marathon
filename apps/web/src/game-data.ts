export type CharacterId = "surangi" | "turtle";
export type SkinId = string;
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
    label: "해커 거북이",
    subtitle: "멀티 모니터 앞에 앉은 메인 거북이",
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
    label: "분석가 거북이",
    subtitle: "투명 테이블에서 데이터를 다루는 전략형 거북이",
    price: 190,
    tint: 0xffffff,
    accentColor: "#7db486",
    badge: "시그니처",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-analyst.png",
    },
  },
  {
    id: "turtle-sprint",
    characterId: "turtle",
    label: "스트리머 거북이",
    subtitle: "키보드 세팅이 강조된 퍼포먼스형 거북이",
    price: 220,
    tint: 0xffffff,
    accentColor: "#d56d5d",
    badge: "신규",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-streamer.png",
    },
  },
  {
    id: "turtle-writer",
    characterId: "turtle",
    label: "작가 거북이",
    subtitle: "깃펜과 책상이 돋보이는 집중형 거북이",
    price: 180,
    tint: 0xffffff,
    accentColor: "#7d8f5b",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-writer.png",
    },
  },
  {
    id: "turtle-accountant",
    characterId: "turtle",
    label: "정산 거북이",
    subtitle: "계산기와 영수증을 챙긴 재무형 거북이",
    price: 170,
    tint: 0xffffff,
    accentColor: "#d0a33b",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-accountant.png",
    },
  },
  {
    id: "turtle-filmmaker",
    characterId: "turtle",
    label: "필름메이커 거북이",
    subtitle: "카메라 리그를 다루는 제작형 거북이",
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
    label: "그래피티 거북이",
    subtitle: "벽화와 스프레이 콘셉트의 스트릿 거북이",
    price: 195,
    tint: 0xffffff,
    accentColor: "#59b9b5",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-graffiti.png",
    },
  },
  {
    id: "turtle-dj",
    characterId: "turtle",
    label: "DJ 거북이",
    subtitle: "콘솔과 전화기 사이를 오가는 믹서형 거북이",
    price: 230,
    tint: 0xffffff,
    accentColor: "#d78a3d",
    badge: "시그니처",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-dj.png",
    },
  },
  {
    id: "turtle-spacewalk",
    characterId: "turtle",
    label: "우주유영 거북이",
    subtitle: "동료와 함께 출격하는 우주 탐사 거북이",
    price: 240,
    tint: 0xffffff,
    accentColor: "#b8bbc9",
    badge: "전설",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-spacewalk.png",
    },
  },
  {
    id: "turtle-chef-white",
    characterId: "turtle",
    label: "화이트 셰프 거북이",
    subtitle: "셰프 복장을 갖춘 주방형 거북이",
    price: 185,
    tint: 0xffffff,
    accentColor: "#d2d2d2",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-chef-white.png",
    },
  },
  {
    id: "turtle-medalist",
    characterId: "turtle",
    label: "메달리스트 거북이",
    subtitle: "수상 포즈가 강조된 챔피언 거북이",
    price: 210,
    tint: 0xffffff,
    accentColor: "#d3af39",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-medalist.png",
    },
  },
  {
    id: "turtle-firefighter",
    characterId: "turtle",
    label: "소방관 거북이",
    subtitle: "호스를 든 현장형 거북이",
    price: 205,
    tint: 0xffffff,
    accentColor: "#d55a3e",
    badge: "신규",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-firefighter.png",
    },
  },
  {
    id: "turtle-diver",
    characterId: "turtle",
    label: "다이버 거북이",
    subtitle: "잠수복과 장비가 완성된 심해 거북이",
    price: 220,
    tint: 0xffffff,
    accentColor: "#d28a2a",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-diver.png",
    },
  },
  {
    id: "turtle-rose-agent",
    characterId: "turtle",
    label: "로즈 에이전트 거북이",
    subtitle: "장미와 마스크가 포인트인 미스터리 거북이",
    price: 215,
    tint: 0xffffff,
    accentColor: "#5a5a5a",
    badge: "희귀",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-rose-agent.png",
    },
  },
  {
    id: "turtle-gardener",
    characterId: "turtle",
    label: "가드너 거북이",
    subtitle: "물뿌리개를 든 정원형 거북이",
    price: 170,
    tint: 0xffffff,
    accentColor: "#79a85a",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-gardener.png",
    },
  },
  {
    id: "turtle-builder",
    characterId: "turtle",
    label: "빌더 거북이",
    subtitle: "망치와 공구 벨트를 장착한 거북이",
    price: 200,
    tint: 0xffffff,
    accentColor: "#58b4b4",
    badge: "신규",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-builder.png",
    },
  },
  {
    id: "turtle-headset",
    characterId: "turtle",
    label: "헤드셋 거북이",
    subtitle: "오퍼레이터 감성의 퍼포먼스 거북이",
    price: 190,
    tint: 0xffffff,
    accentColor: "#8d6ac6",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-headset.png",
    },
  },
  {
    id: "turtle-scholar",
    characterId: "turtle",
    label: "학자 거북이",
    subtitle: "책상과 깃펜이 어울리는 연구형 거북이",
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
    label: "설계사 거북이",
    subtitle: "블록 설계를 하는 전략형 거북이",
    price: 180,
    tint: 0xffffff,
    accentColor: "#7da85f",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-architect.png",
    },
  },
  {
    id: "turtle-astronaut",
    characterId: "turtle",
    label: "우주비행사 거북이",
    subtitle: "화이트 수트 버전의 솔로 우주 거북이",
    price: 235,
    tint: 0xffffff,
    accentColor: "#c0c8d9",
    badge: "전설",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-astronaut.png",
    },
  },
  {
    id: "turtle-chef-green",
    characterId: "turtle",
    label: "그린 셰프 거북이",
    subtitle: "숟가락을 든 셰프 콘셉트 거북이",
    price: 180,
    tint: 0xffffff,
    accentColor: "#87a860",
    badge: "인기",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-chef-green.png",
    },
  },
  {
    id: "turtle-arcade",
    characterId: "turtle",
    label: "아케이드 거북이",
    subtitle: "게임기 앞에 선 플레이어 거북이",
    price: 205,
    tint: 0xffffff,
    accentColor: "#5c8fc7",
    badge: "시그니처",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-arcade.png",
    },
  },
  {
    id: "turtle-painter",
    characterId: "turtle",
    label: "페인터 거북이",
    subtitle: "앞치마와 베레모가 포인트인 아티스트 거북이",
    price: 185,
    tint: 0xffffff,
    accentColor: "#78a764",
    badge: "신규",
    art: {
      kind: "image",
      imagePath: "/assets/characters/turtle_roster/turtle-painter.png",
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

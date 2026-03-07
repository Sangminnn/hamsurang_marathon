import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type StoredProfile = {
  preferredName: string;
  coins: number;
  equippedSkin: string;
  equippedTrail: "mint" | "spark" | "flame" | "petal";
  unlockedSkins: string[];
  unlockedTrails: Array<"mint" | "spark" | "flame" | "petal">;
  updatedAt: string;
};

type StoredProfiles = Record<string, StoredProfile>;

const FREE_SKIN_IDS = [
  "surangi-classic",
  "surangi-detective",
  "surangi-rainbow",
  "surangi-mechanic",
  "surangi-sun",
  "surangi-skater",
  "surangi-explorer",
  "surangi-farmer",
  "surangi-blossom",
  "surangi-headset",
  "surangi-chef",
  "surangi-runner",
  "surangi-winter",
  "surangi-pilot",
  "surangi-banker",
  "surangi-cadet",
  "turtle-classic",
  "turtle-coder",
  "turtle-sprint",
  "turtle-writer",
  "turtle-accountant",
  "turtle-filmmaker",
  "turtle-graffiti",
  "turtle-chef-white",
  "turtle-medalist",
  "turtle-firefighter",
  "turtle-diver",
  "turtle-rose-agent",
  "turtle-gardener",
  "turtle-builder",
  "turtle-headset",
  "turtle-scholar",
  "turtle-architect",
  "turtle-chef-green",
  "turtle-arcade",
  "turtle-painter",
] as const;

const DATA_DIR = path.resolve(process.cwd(), "data");
const PROFILE_PATH = path.join(DATA_DIR, "profiles.json");

const DEFAULT_PROFILE: StoredProfile = {
  preferredName: "",
  coins: 180,
  equippedSkin: "surangi-classic",
  equippedTrail: "mint",
  unlockedSkins: [...FREE_SKIN_IDS],
  unlockedTrails: ["mint"],
  updatedAt: new Date(0).toISOString(),
};

function mergeFreeSkins(profile: StoredProfile): StoredProfile {
  return {
    ...profile,
    unlockedSkins: Array.from(new Set([...FREE_SKIN_IDS, ...profile.unlockedSkins])),
  };
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readProfiles(): Promise<StoredProfiles> {
  await ensureDataDir();

  try {
    const raw = await readFile(PROFILE_PATH, "utf8");
    return JSON.parse(raw) as StoredProfiles;
  } catch {
    return {};
  }
}

async function writeProfiles(profiles: StoredProfiles) {
  await ensureDataDir();
  await writeFile(PROFILE_PATH, JSON.stringify(profiles, null, 2));
}

export async function getProfile(playerId: string) {
  const profiles = await readProfiles();
  return mergeFreeSkins(profiles[playerId] ?? DEFAULT_PROFILE);
}

export async function saveProfile(playerId: string, profile: Omit<StoredProfile, "updatedAt">) {
  const profiles = await readProfiles();
  profiles[playerId] = mergeFreeSkins({
    ...profile,
    updatedAt: new Date().toISOString(),
  });
  await writeProfiles(profiles);
  return profiles[playerId];
}

export async function loginByNickname(nickname: string) {
  const normalizedNickname = nickname.trim().slice(0, 12);
  const profiles = await readProfiles();

  const existingEntry = Object.entries(profiles).find(
    ([, profile]) => profile.preferredName === normalizedNickname,
  );

  if (existingEntry) {
    const [playerId, profile] = existingEntry;
    return {
      playerId,
      profile: mergeFreeSkins(profile),
      isNewUser: false,
    };
  }

  const playerId = randomUUID();
  const profile: StoredProfile = {
    ...DEFAULT_PROFILE,
    preferredName: normalizedNickname,
    updatedAt: new Date().toISOString(),
  };

  profiles[playerId] = profile;
  await writeProfiles(profiles);

  return {
    playerId,
    profile,
    isNewUser: true,
  };
}

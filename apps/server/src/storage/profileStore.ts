import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type StoredProfile = {
  preferredName: string;
  coins: number;
  equippedHat: "none" | "cap" | "crown" | "leaf" | "visor";
  equippedTrail: "mint" | "spark" | "flame" | "petal";
  unlockedHats: Array<"none" | "cap" | "crown" | "leaf" | "visor">;
  unlockedTrails: Array<"mint" | "spark" | "flame" | "petal">;
  updatedAt: string;
};

type StoredProfiles = Record<string, StoredProfile>;

const DATA_DIR = path.resolve(process.cwd(), "data");
const PROFILE_PATH = path.join(DATA_DIR, "profiles.json");

const DEFAULT_PROFILE: StoredProfile = {
  preferredName: "",
  coins: 180,
  equippedHat: "cap",
  equippedTrail: "mint",
  unlockedHats: ["none", "cap"],
  unlockedTrails: ["mint"],
  updatedAt: new Date(0).toISOString(),
};

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
  return profiles[playerId] ?? DEFAULT_PROFILE;
}

export async function saveProfile(playerId: string, profile: Omit<StoredProfile, "updatedAt">) {
  const profiles = await readProfiles();
  profiles[playerId] = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
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
      profile,
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

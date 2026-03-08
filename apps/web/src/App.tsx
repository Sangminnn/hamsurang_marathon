import { startTransition, useEffect, useRef, useState } from "react";

import { Client, Room } from "colyseus.js";
import { toast as sonnerToast } from "sonner";

import { CharacterArt } from "./components/CharacterArt";
import { RaceTrackPhaser } from "./components/RaceTrackPhaser";
import {
  DEFAULT_PROFILE,
  FREE_SKIN_IDS,
  TRAILS,
  getCharacterSkins,
  getDefaultSkinForCharacter,
  PLAYABLE_CHARACTERS,
  getRaceReward,
  getSkinMeta,
  getTrailMeta,
  type CharacterId,
  type CosmeticProfile,
  type SkinId,
  type TrailId,
} from "./game-data";

type RoomPhase = "lobby" | "countdown" | "racing" | "results";
type GameMode = "sprint";
type InputDirection = "left" | "right";
type CustomizingTab = "skins" | "trails";
type AppRoute =
  | { kind: "home" }
  | { kind: "room"; roomId: string; phase: RoomPhase | "room" };

type PlayerSnapshot = {
  renderKey: string;
  sessionId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  characterId: CharacterId;
  skinId: SkinId;
  trailId: TrailId;
  progress: number;
  headingDeg: number;
  lateralOffset: number;
  finishMs: number;
  place: number;
  turnDirection: number;
};

type RoomSnapshot = {
  roomId: string;
  phase: RoomPhase;
  gameMode: GameMode;
  countdownEndsAt: number;
  raceEndsAt: number;
  winnerSessionId: string;
  players: PlayerSnapshot[];
};

type ActiveRoom = {
  roomId: string;
  phase: RoomPhase;
  gameMode: GameMode;
  playerCount: number;
  hostName: string;
  createdAt: string;
};

type RawPlayerLike = Partial<PlayerSnapshot> & {
  sessionId?: string;
  name?: string;
  characterId?: string;
  skinId?: string;
  trailId?: string;
};

type RawRoomStateLike = {
  phase?: RoomPhase;
  gameMode?: GameMode;
  countdownEndsAt?: number;
  raceEndsAt?: number;
  winnerSessionId?: string;
  players?: Record<string, RawPlayerLike>;
  toJSON?: () => RawRoomStateLike;
};

const STORAGE_KEY = "hamsurang-marathon-profile";
const AUTH_STORAGE_KEY = "hamsurang-marathon-auth";
let memoryProfile = DEFAULT_PROFILE;
let memoryAuth = {
  playerId: "",
  nickname: "",
};

const GAME_MODE_OPTIONS: Array<{ value: GameMode; label: string; description: string }> = [
  {
    value: "sprint",
    label: "스피드 레이스",
    description: "30초 동안 가장 멀리 달린 플레이어가 우승합니다.",
  },
];

function getDefaultServerUrl() {
  if (typeof window === "undefined") {
    return "ws://localhost:2567";
  }

  return `ws://${window.location.hostname}:2567`;
}

function parseRoute(pathname: string): AppRoute {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments[0] !== "room" || !segments[1]) {
    return { kind: "home" };
  }

  const phaseSegment = segments[2];
  if (phaseSegment === "countdown") {
    return { kind: "room", roomId: segments[1], phase: "countdown" };
  }
  if (phaseSegment === "race") {
    return { kind: "room", roomId: segments[1], phase: "racing" };
  }
  if (phaseSegment === "results") {
    return { kind: "room", roomId: segments[1], phase: "results" };
  }

  return { kind: "room", roomId: segments[1], phase: "room" };
}

function getRoutePath(route: AppRoute) {
  if (route.kind === "home") {
    return "/";
  }

  switch (route.phase) {
    case "countdown":
      return `/room/${route.roomId}/countdown`;
    case "racing":
      return `/room/${route.roomId}/race`;
    case "results":
      return `/room/${route.roomId}/results`;
    default:
      return `/room/${route.roomId}`;
  }
}

function getRouteForRoom(roomId: string, phase: RoomPhase): AppRoute {
  return {
    kind: "room",
    roomId,
    phase: phase === "lobby" ? "room" : phase,
  };
}

function normalizeCharacterId(value: string | undefined): CharacterId {
  return "surangi";
}

function normalizeSkinId(value: string | undefined, fallbackCharacterId: CharacterId): SkinId {
  return getCharacterSkins("surangi").some((skin) => skin.id === value)
    ? (value as SkinId)
    : getDefaultSkinForCharacter(fallbackCharacterId);
}

function normalizeUnlockedSkinIds(skinIds: string[] | undefined) {
  return Array.from(
    new Set([...(skinIds ?? []), ...FREE_SKIN_IDS].map((skinId) => normalizeSkinId(skinId, "surangi"))),
  );
}

function normalizeTrailId(value: string | undefined): TrailId {
  return TRAILS.some((trail) => trail.id === value) ? (value as TrailId) : "mint";
}

function normalizePlayer(rawPlayer: RawPlayerLike, fallbackKey: string): PlayerSnapshot {
  const sessionId = rawPlayer.sessionId ?? "";
  const characterId = normalizeCharacterId(rawPlayer.characterId);

  return {
    renderKey: sessionId || fallbackKey,
    sessionId,
    name: rawPlayer.name ?? "Runner",
    isHost: rawPlayer.isHost ?? false,
    isReady: rawPlayer.isReady ?? false,
    isConnected: rawPlayer.isConnected ?? true,
    characterId,
    skinId: normalizeSkinId(rawPlayer.skinId, characterId),
    trailId: normalizeTrailId(rawPlayer.trailId),
    progress: rawPlayer.progress ?? 0,
    headingDeg: rawPlayer.headingDeg ?? 0,
    lateralOffset: rawPlayer.lateralOffset ?? 0,
    finishMs: rawPlayer.finishMs ?? 0,
    place: rawPlayer.place ?? 0,
    turnDirection: rawPlayer.turnDirection ?? 1,
  };
}

function snapshotRoom(room: Room): RoomSnapshot {
  const state = room.state as RawRoomStateLike;
  const jsonState = typeof state?.toJSON === "function" ? state.toJSON() : state;

  const rawPlayers = Object.entries(jsonState.players ?? {}).map(
    ([sessionId, player]) => ({
      ...player,
      sessionId,
    }),
  );

  return {
    roomId: room.roomId,
    phase: jsonState.phase ?? "lobby",
    gameMode: jsonState.gameMode ?? "sprint",
    countdownEndsAt: jsonState.countdownEndsAt ?? 0,
    raceEndsAt: jsonState.raceEndsAt ?? 0,
    winnerSessionId: jsonState.winnerSessionId ?? "",
    players: rawPlayers
      .map((player, index) => normalizePlayer(player, `player-${index}`))
      .sort((left, right) => {
        if (left.place && right.place) {
          return left.place - right.place;
        }

        return right.progress - left.progress;
      }),
  };
}

function formatMs(ms: number, unit = "s") {
  return `${Math.max(0, Math.ceil(ms / 1000))}${unit}`;
}

function getStatusLabel(phase: RoomPhase) {
  switch (phase) {
    case "lobby":
      return "대기실";
    case "countdown":
      return "카운트다운";
    case "racing":
      return "레이스";
    case "results":
      return "결과";
  }
}

function loadProfile() {
  if (typeof window === "undefined") {
    return memoryProfile;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return memoryProfile;
    }

    const parsed = JSON.parse(raw) as Partial<CosmeticProfile>;
    return {
      preferredName: parsed.preferredName ?? memoryProfile.preferredName,
      coins: parsed.coins ?? memoryProfile.coins,
      equippedSkin: normalizeSkinId(parsed.equippedSkin, "surangi"),
      equippedTrail: normalizeTrailId(parsed.equippedTrail),
      unlockedSkins: normalizeUnlockedSkinIds(parsed.unlockedSkins ?? memoryProfile.unlockedSkins),
      unlockedTrails: (parsed.unlockedTrails ?? memoryProfile.unlockedTrails).map(normalizeTrailId),
    };
  } catch {
    return memoryProfile;
  }
}

function persistProfile(profile: CosmeticProfile) {
  memoryProfile = profile;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // 브라우저 컨텍스트에서 저장소 접근이 막힌 경우 메모리 fallback만 사용한다.
  }
}

function getSavedAuth() {
  if (typeof window === "undefined") {
    return memoryAuth;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return memoryAuth;
    }

    const parsed = JSON.parse(raw) as Partial<typeof memoryAuth>;
    memoryAuth = {
      playerId: parsed.playerId ?? "",
      nickname: parsed.nickname ?? "",
    };
    return memoryAuth;
  } catch {
    return memoryAuth;
  }
}

function persistAuth(auth: { playerId: string; nickname: string }) {
  memoryAuth = auth;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // ignore storage failures
  }
}

function getHttpApiBase(serverUrl: string) {
  return serverUrl.replace(/^ws/, "http");
}

export function App() {
  const [serverUrl] = useState(getDefaultServerUrl);
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === "undefined" ? { kind: "home" } : parseRoute(window.location.pathname),
  );
  const [auth, setAuth] = useState(getSavedAuth);
  const [playerName, setPlayerName] = useState(() => getSavedAuth().nickname || loadProfile().preferredName);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [characterId, setCharacterId] = useState<CharacterId>(() => getSkinMeta(loadProfile().equippedSkin).characterId);
  const [profile, setProfile] = useState<CosmeticProfile>(loadProfile);
  const [countdownLabel, setCountdownLabel] = useState("3");
  const [raceLabel, setRaceLabel] = useState("30s");
  const [toast, setToast] = useState("");
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customizingTab, setCustomizingTab] = useState<CustomizingTab>("skins");
  const [roomSnapshot, setRoomSnapshot] = useState<RoomSnapshot | null>(null);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected">("idle");

  const roomRef = useRef<Room | null>(null);
  const rewardedRaceRef = useRef<number>(0);
  const attemptedRouteRoomIdRef = useRef<string>("");
  const roomSnapshotRef = useRef(roomSnapshot);

  function navigateTo(nextRoute: AppRoute, options?: { replace?: boolean }) {
    setRoute((current) => {
      const nextPath = getRoutePath(nextRoute);
      const currentPath = getRoutePath(current);

      if (typeof window !== "undefined" && nextPath !== window.location.pathname) {
        window.history[options?.replace ? "replaceState" : "pushState"](null, "", nextPath);
      }

      return currentPath === nextPath ? current : nextRoute;
    });
  }

  function bindRoom(nextRoom: Room) {
    roomRef.current = nextRoom;
    attemptedRouteRoomIdRef.current = nextRoom.roomId;
    setConnectionState("connected");
    setRoomSnapshot(snapshotRoom(nextRoom));
    navigateTo(getRouteForRoom(nextRoom.roomId, snapshotRoom(nextRoom).phase));

    nextRoom.onStateChange((state) => {
      startTransition(() => {
        const fakeRoom = { ...nextRoom, state } as Room;
        setRoomSnapshot(snapshotRoom(fakeRoom));
      });
    });

    nextRoom.onMessage("toast", (message: { message: string }) => {
      setToast(message.message);
    });

    nextRoom.onLeave(() => {
      roomRef.current = null;
      setRoomSnapshot(null);
      setConnectionState("idle");
      attemptedRouteRoomIdRef.current = "";
      navigateTo({ kind: "home" }, { replace: true });
    });

    nextRoom.send("selectCharacter", { characterId });
    nextRoom.send("selectLoadout", {
      skinId: profile.equippedSkin,
      trailId: profile.equippedTrail,
    });
  }

  useEffect(() => {
    persistAuth(auth);
  }, [auth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (auth.nickname) {
      setPlayerName(auth.nickname);
    }
  }, [auth.nickname]);

  useEffect(() => {
    if (!roomSnapshot) {
      return;
    }

    navigateTo(getRouteForRoom(roomSnapshot.roomId, roomSnapshot.phase));
  }, [roomSnapshot]);

  useEffect(() => {
    if (route.kind !== "room" || roomSnapshot || connectionState === "connecting") {
      return;
    }

    if (attemptedRouteRoomIdRef.current === route.roomId) {
      return;
    }

    if (!playerName.trim() && !auth.playerId) {
      setToast("룸에 입장하려면 닉네임이 필요합니다.");
      navigateTo({ kind: "home" }, { replace: true });
      return;
    }

    attemptedRouteRoomIdRef.current = route.roomId;
    void joinRoomById(route.roomId, { fallbackToHomeOnError: true, replaceUrl: true });
  }, [route, roomSnapshot, connectionState, playerName, auth.playerId]);

  useEffect(() => {
    if (route.kind === "home" && roomRef.current) {
      leaveRoom();
    }
  }, [route.kind]);

  useEffect(() => {
    let cancelled = false;

    if (!auth.playerId) {
      return;
    }

    async function hydrateProfile() {
      try {
        const response = await fetch(`${getHttpApiBase(serverUrl)}/api/profile/${auth.playerId}`);
        if (!response.ok) {
          return;
        }

        const nextProfile = (await response.json()) as CosmeticProfile;
        if (cancelled) {
          return;
        }

        const normalizedEquippedSkin = normalizeSkinId(nextProfile.equippedSkin, "surangi");
        setProfile({
          preferredName: nextProfile.preferredName ?? "",
          coins: nextProfile.coins ?? DEFAULT_PROFILE.coins,
          equippedSkin: normalizedEquippedSkin,
          equippedTrail: normalizeTrailId(nextProfile.equippedTrail),
          unlockedSkins: normalizeUnlockedSkinIds(nextProfile.unlockedSkins ?? DEFAULT_PROFILE.unlockedSkins),
          unlockedTrails: (nextProfile.unlockedTrails ?? DEFAULT_PROFILE.unlockedTrails).map(normalizeTrailId),
        });
        setCharacterId(getSkinMeta(normalizedEquippedSkin).characterId);
        setPlayerName(nextProfile.preferredName ?? "");
      } catch {
        // 서버 프로필이 없더라도 기본 프로필로 계속 진행한다.
      }
    }

    hydrateProfile();

    return () => {
      cancelled = true;
    };
  }, [auth.playerId, serverUrl]);

  useEffect(() => {
    let cancelled = false;

    async function fetchRooms() {
      try {
        const response = await fetch(`${getHttpApiBase(serverUrl)}/api/rooms`);
        if (!response.ok) {
          return;
        }

        const rooms = (await response.json()) as ActiveRoom[];
        if (!cancelled) {
          setActiveRooms(rooms);
        }
      } catch {
        // ignore polling errors
      }
    }

    fetchRooms();
    const intervalId = window.setInterval(fetchRooms, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [roomSnapshot?.roomId, serverUrl]);

  useEffect(() => {
    persistProfile(profile);
  }, [profile]);

  useEffect(() => {
    const trimmed = playerName.trim().slice(0, 12);
    setProfile((current) =>
      current.preferredName === trimmed
        ? current
        : {
            ...current,
            preferredName: trimmed,
          },
    );
  }, [playerName]);

  useEffect(() => {
    if (!auth.playerId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetch(`${getHttpApiBase(serverUrl)}/api/profile/${auth.playerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profile,
          preferredName: playerName.trim().slice(0, 12),
        }),
      }).catch(() => {
        // 네트워크 이슈 시 로컬 캐시만 유지한다.
      });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [auth.playerId, playerName, profile, serverUrl]);

  useEffect(() => {
    roomSnapshotRef.current = roomSnapshot;
  }, [roomSnapshot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const snap = roomSnapshotRef.current;
      if (!snap) {
        return;
      }

      if (snap.phase === "countdown") {
        setCountdownLabel(formatMs(snap.countdownEndsAt - Date.now(), ""));
      }

      if (snap.phase === "racing") {
        setRaceLabel(formatMs(snap.raceEndsAt - Date.now()));
      }
    }, 200);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      roomRef.current?.leave();
    };
  }, []);

  const localPlayer = roomSnapshot?.players.find(
    (player) => player.sessionId === roomRef.current?.sessionId,
  );
  const winner = roomSnapshot?.players.find(
    (player) => player.sessionId === roomSnapshot.winnerSessionId,
  );

  useEffect(() => {
    if (!roomSnapshot || !localPlayer || roomSnapshot.phase !== "results") {
      return;
    }

    if (rewardedRaceRef.current === roomSnapshot.raceEndsAt) {
      return;
    }

    rewardedRaceRef.current = roomSnapshot.raceEndsAt;
    const reward = getRaceReward(localPlayer.place);
    setProfile((current) => ({
      ...current,
      preferredName: playerName.trim().slice(0, 12),
      coins: current.coins + reward,
    }));
    setToast(`레이스 보상 ${reward}코인을 획득했습니다.`);
  }, [localPlayer, roomSnapshot]);

  useEffect(() => {
    if (!roomRef.current || roomSnapshot?.phase !== "lobby") {
      return;
    }

    roomRef.current.send("selectLoadout", {
      skinId: profile.equippedSkin,
      trailId: profile.equippedTrail,
    });
  }, [profile.equippedSkin, profile.equippedTrail, roomSnapshot?.phase]);

  async function loginWithNickname() {
    if (!playerName.trim()) {
      setToast("닉네임을 입력해 주세요.");
      return null;
    }

    if (playerName.trim().length > 12) {
      setToast("닉네임은 12자 이하로 입력해 주세요.");
      return null;
    }

    startTransition(() => {
      setConnectionState("connecting");
      setToast("");
    });

    try {
      const client = new Client(serverUrl);
      const authRoom = await client.joinOrCreate("auth", {
        nickname: playerName.trim(),
      });

      const authState = await new Promise<{ playerId: string; nickname?: string; isNewUser?: boolean }>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error("로그인 응답이 지연되고 있습니다."));
        }, 2000);

        authRoom.onMessage("authenticated", (message) => {
          window.clearTimeout(timeoutId);
          resolve(message as { playerId: string; nickname?: string; isNewUser?: boolean });
        });
      });

      const nextAuth = {
        playerId: authState.playerId,
        nickname: authState.nickname ?? playerName.trim(),
      };
      setAuth(nextAuth);
      setToast(authState.isNewUser ? "새 계정으로 시작합니다." : "기존 닉네임 계정으로 로그인했습니다.");
      authRoom.leave();
      setConnectionState("idle");
      return nextAuth;
    } catch (error) {
      setConnectionState("idle");
      setToast(error instanceof Error ? error.message : "로그인에 실패했습니다.");
      return null;
    }
  }

  async function ensureAuth() {
    if (auth.playerId) {
      return auth;
    }

    return loginWithNickname();
  }

  async function joinRoomById(
    roomId: string,
    options?: {
      fallbackToHomeOnError?: boolean;
      replaceUrl?: boolean;
    },
  ) {
    const currentAuth = await ensureAuth();
    if (!currentAuth?.playerId) {
      setConnectionState("idle");
      return;
    }

    if (!playerName.trim()) {
      setToast("닉네임을 먼저 입력해 주세요.");
      if (options?.fallbackToHomeOnError) {
        navigateTo({ kind: "home" }, { replace: true });
      }
      return;
    }

    try {
      const client = new Client(serverUrl);
      const nextRoom = await client.joinById(roomId, {
        name: playerName.trim(),
      });

      bindRoom(nextRoom);
      if (options?.replaceUrl) {
        navigateTo(getRouteForRoom(nextRoom.roomId, snapshotRoom(nextRoom).phase));
      }
    } catch (error) {
      setConnectionState("idle");
      attemptedRouteRoomIdRef.current = "";
      setToast(error instanceof Error ? error.message : "연결에 실패했습니다.");
      if (options?.fallbackToHomeOnError) {
        navigateTo({ kind: "home" }, { replace: true });
      }
    }
  }

  async function connect(kind: "create" | "join") {
    const currentAuth = await ensureAuth();
    if (!currentAuth?.playerId) {
      return;
    }

    if (!playerName.trim()) {
      setToast("닉네임을 입력해 주세요.");
      return;
    }

    if (playerName.trim().length > 12) {
      setToast("닉네임은 12자 이하로 입력해 주세요.");
      return;
    }

    startTransition(() => {
      setConnectionState("connecting");
      setToast("");
    });

    try {
      const client = new Client(serverUrl);
      const nextRoom =
        kind === "create"
          ? await client.create("marathon", { name: playerName.trim() })
          : null;

      if (kind === "join") {
        await joinRoomById(joinRoomId.trim(), { fallbackToHomeOnError: true, replaceUrl: true });
        return;
      }

      if (!nextRoom) {
        throw new Error("연결에 실패했습니다.");
      }

      bindRoom(nextRoom);
    } catch (error) {
      setConnectionState("idle");
      attemptedRouteRoomIdRef.current = "";
      setToast(error instanceof Error ? error.message : "연결에 실패했습니다.");
    }
  }

  function leaveRoom() {
    roomRef.current?.leave();
    roomRef.current = null;
    setRoomSnapshot(null);
    setConnectionState("idle");
    attemptedRouteRoomIdRef.current = "";
    navigateTo({ kind: "home" });
  }

  function sendReady(nextReady: boolean) {
    roomRef.current?.send("setReady", { ready: nextReady });
  }

  function selectGame(gameMode: GameMode) {
    roomRef.current?.send("selectGame", { gameMode });
  }

  function selectCharacter(nextCharacterId: CharacterId) {
    setCharacterId(nextCharacterId);
    setProfile((current) => {
      const nextDefaultSkin = getDefaultSkinForCharacter(nextCharacterId);
      const nextSkin = getSkinMeta(current.equippedSkin).characterId === nextCharacterId
        ? current.equippedSkin
        : nextDefaultSkin;

      return {
        ...current,
        preferredName: playerName.trim().slice(0, 12),
        equippedSkin: nextSkin,
        unlockedSkins: current.unlockedSkins.includes(nextDefaultSkin)
          ? current.unlockedSkins
          : [...current.unlockedSkins, nextDefaultSkin],
      };
    });
    roomRef.current?.send("selectCharacter", {
      characterId: nextCharacterId,
    });
  }

  function sendInput(direction: InputDirection) {
    roomRef.current?.send("inputStep", {
      direction,
      clientSentAt: Date.now(),
    });
  }

  function kickPlayer(sessionId: string) {
    roomRef.current?.send("kickPlayer", { sessionId });
  }

  function startSoloPreview() {
    roomRef.current?.send("startSoloPreview");
  }

  function openCustomizer(tab: CustomizingTab) {
    setCustomizingTab(tab);
    setIsCustomizerOpen(true);
  }

  function closeCustomizer() {
    setIsCustomizerOpen(false);
  }

  async function closeRoomByAdmin(roomId: string) {
    const response = await fetch(`${getHttpApiBase(serverUrl)}/api/rooms/${roomId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setToast("운영자 도구로 방을 종료했습니다.");
      setActiveRooms((current) => current.filter((room) => room.roomId !== roomId));
    }
  }

  function showInsufficientFundsToast(kind: "skin" | "trail", itemId: string, title: string, description: string) {
    sonnerToast.error(title, {
      id: `insufficient-funds:${kind}:${itemId}`,
      description,
    });
  }

  function joinKnownRoom(roomId: string) {
    setJoinRoomId(roomId);

    if (!playerName.trim()) {
      setToast("닉네임을 먼저 입력해 주세요.");
      return;
    }

    startTransition(() => {
      setConnectionState("connecting");
      setToast("");
    });

    void (async () => {
      await joinRoomById(roomId, { fallbackToHomeOnError: true, replaceUrl: true });
    })();
  }

  function unlockOrEquipSkin(skinId: SkinId) {
    const skin = getSkinMeta(skinId);

    setCharacterId(skin.characterId);
    setProfile((current) => {
      if (!current.unlockedSkins.includes(skinId)) {
        if (current.coins < skin.price) {
          setToast("코인이 부족합니다.");
          showInsufficientFundsToast(
            "skin",
            skinId,
            "리워드가 부족합니다",
            `${skin.label} 구매에는 ${skin.price}코인이 필요합니다. 현재 보유 코인은 ${current.coins}입니다.`,
          );
          return current;
        }

        return {
          ...current,
          preferredName: playerName.trim().slice(0, 12),
          coins: current.coins - skin.price,
          equippedSkin: skinId,
          unlockedSkins: [...current.unlockedSkins, skinId],
        };
      }

      return {
        ...current,
        preferredName: playerName.trim().slice(0, 12),
        equippedSkin: skinId,
      };
    });

    roomRef.current?.send("selectCharacter", {
      characterId: skin.characterId,
    });
  }

  function unlockOrEquipTrail(trailId: TrailId) {
    const trail = getTrailMeta(trailId);

    setProfile((current) => {
      if (!current.unlockedTrails.includes(trailId)) {
        if (current.coins < trail.price) {
          setToast("코인이 부족합니다.");
          showInsufficientFundsToast(
            "trail",
            trailId,
            "코인이 부족합니다",
            `${trail.label} 해금에는 ${trail.price}코인이 필요합니다. 현재 보유 코인은 ${current.coins}입니다.`,
          );
          return current;
        }

        return {
          ...current,
          preferredName: playerName.trim().slice(0, 12),
          coins: current.coins - trail.price,
          unlockedTrails: [...current.unlockedTrails, trailId],
          equippedTrail: trailId,
        };
      }

      return {
        ...current,
        preferredName: playerName.trim().slice(0, 12),
        equippedTrail: trailId,
      };
    });
  }

  const racingPlayers =
    roomSnapshot?.players.map((player) => ({
      ...player,
      isLocal: player.sessionId === roomRef.current?.sessionId,
    })) ?? [];
  const selectedCharacterId = localPlayer?.characterId ?? characterId;
  const selectedCharacterSkins = getCharacterSkins(selectedCharacterId);
  const equippedSkinMeta = getSkinMeta(profile.equippedSkin);
  const raceRanking = [...racingPlayers].sort((left, right) => {
    if (left.place && right.place) {
      return left.place - right.place;
    }

    return right.progress - left.progress;
  });
  const localRaceRank = localPlayer?.place
    || Math.max(1, raceRanking.findIndex((player) => player.sessionId === localPlayer?.sessionId) + 1);

  if (route.kind === "room" && !roomSnapshot) {
    return (
      <main className="stage-page-shell">
        <section className="stage-page">
          <header className="stage-page-header">
            <div className="stage-page-copy">
              <p className="eyebrow">Room Entry</p>
              <h1>{route.roomId}</h1>
              <p>레이스룸에 연결 중입니다. 잠시만 기다려 주세요.</p>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                attemptedRouteRoomIdRef.current = "";
                navigateTo({ kind: "home" }, { replace: true });
              }}
            >
              홈으로
            </button>
          </header>

          <section className="panel results-stage-panel">
            <section className="countdown-stage">
              <p className="countdown-label">
                {connectionState === "connecting" ? "레이스룸 연결 중" : "레이스룸 준비 중"}
              </p>
              <strong className="countdown-number">...</strong>
              <p className="countdown-copy">같은 URL로 다시 방문해도 이 방으로 바로 들어올 수 있게 연결을 맞추고 있습니다.</p>
            </section>
          </section>
        </section>
      </main>
    );
  }

  if (roomSnapshot?.phase === "racing") {
    return (
      <main className="race-page-shell">
        <section className="race-page">
          <header className="race-page-header">
            <div className="race-page-hud race-page-hud-compact">
              <article className="race-hud-card race-hud-card-accent">
                <span>남은 시간</span>
                <strong>{raceLabel}</strong>
              </article>
              <article className="race-hud-card">
                <span>현재 순위</span>
                <strong>{localRaceRank}위</strong>
              </article>
            </div>
          </header>

          <section className="race-stage-full">
            <div className="race-arena-panel">
              <RaceTrackPhaser players={racingPlayers} />
            </div>

            <aside className="race-sidebar">
              <div className="race-standings">
                <div className="section-copy">
                  <p className="panel-title">실시간 순위</p>
                  <p>진행도 기준으로 계속 재정렬됩니다.</p>
                </div>
                <div className="race-standings-list">
                  {raceRanking.map((player, index) => (
                    <article key={player.renderKey} className={player.isLocal ? "race-standing-card active" : "race-standing-card"}>
                      <span className="race-standing-rank">{player.place || index + 1}</span>
                      <CharacterArt className="mini-avatar" skinId={player.skinId} size={32} alt={getSkinMeta(player.skinId).label} />
                      <div className="race-standing-copy">
                        <strong>{player.name}</strong>
                        <span>{player.progress.toFixed(0)}m · 방향 {player.headingDeg > 4 ? "우회전" : player.headingDeg < -4 ? "좌회전" : "직진"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="race-input-panel">
                <button
                  type="button"
                  className="turn-button"
                  onPointerDown={() => sendInput("left")}
                >
                  <span className="turn-button-icon">↻</span>
                  <span className="turn-button-label">방향 전환</span>
                </button>
              </div>
            </aside>
          </section>
        </section>
      </main>
    );
  }

  if (roomSnapshot?.phase === "lobby") {
    return (
      <main className="room-page-shell">
        <section className="room-page">
          <header className="room-page-header">
            <div className="room-page-copy">
              <p className="eyebrow">Race Lobby</p>
              <h1>{roomSnapshot.roomId}</h1>
              <p>참가자를 모으고 세팅을 마치면 바로 다음 레이스를 시작할 수 있습니다.</p>
            </div>
            <button type="button" className="ghost-button" onClick={leaveRoom}>
              나가기
            </button>
          </header>

          <section className="room-page-stack">
            <div className="panel inset">
              <div className="section-copy">
                <p className="panel-title">게임 모드</p>
                <p>방장이 경기 방식을 정하면, 참가자 준비 완료와 함께 자동으로 카운트다운이 시작됩니다.</p>
              </div>
              <div className="mode-grid">
                {GAME_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={roomSnapshot.gameMode === option.value ? "choice mode-choice selected" : "choice mode-choice"}
                    disabled={!localPlayer?.isHost}
                    onClick={() => selectGame(option.value)}
                  >
                    <div className="choice-copy">
                      <strong>{option.label}</strong>
                      <span className="choice-subcopy">{option.description}</span>
                    </div>
                    <span className="choice-meta">
                      {localPlayer?.isHost ? "선택 가능" : "방장 선택"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel inset">
              <div className="section-copy">
                <p className="panel-title">내 출전 세팅</p>
                <p>지금 고른 스킨과 트레일이 레이스 시작과 동시에 그대로 반영됩니다.</p>
              </div>
              <div className="customizer-summary-grid">
                <button type="button" className="customizer-entry" onClick={() => openCustomizer("skins")}>
                  <div className="customizer-entry-copy">
                    <span className="summary-label">캐릭터 스킨</span>
                    <strong>{equippedSkinMeta.label}</strong>
                    <p>{selectedCharacterSkins.length}개 스킨 중 선택 가능</p>
                  </div>
                  <CharacterArt className="customizer-entry-art" skinId={profile.equippedSkin} size={64} alt={equippedSkinMeta.label} />
                </button>
                <button type="button" className="customizer-entry" onClick={() => openCustomizer("trails")}>
                  <div className="customizer-entry-copy">
                    <span className="summary-label">트레일 이펙트</span>
                    <strong>{getTrailMeta(profile.equippedTrail).label}</strong>
                    <p>레이스 중 남는 효과를 바꿔보세요</p>
                  </div>
                  <span className="customizer-entry-icon">{getTrailMeta(profile.equippedTrail).emoji}</span>
                </button>
              </div>

            </div>

            <div className="panel inset">
              <div className="section-head">
                <div className="section-copy">
                  <p className="panel-title">참가자 현황</p>
                  <p>모든 참가자가 준비를 마치면 레이스가 바로 시작됩니다.</p>
                </div>
                <div className="lobby-cta-group">
                  {localPlayer?.isHost && roomSnapshot.players.length === 1 ? (
                    <button
                      type="button"
                      className="secondary-button compact-button ready-toggle"
                      onClick={startSoloPreview}
                    >
                      혼자 테스트 시작
                    </button>
                  ) : null}
                  {localPlayer ? (
                    <button
                      type="button"
                      className={localPlayer.isReady ? "secondary-button compact-button ready-toggle" : "primary-button compact-button ready-toggle"}
                      onClick={() => sendReady(!localPlayer.isReady)}
                    >
                      {localPlayer.isReady ? "준비 해제" : "준비 완료"}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="player-list">
                {roomSnapshot.players.map((player) => (
                  <article key={player.renderKey} className="player-card">
                    <div className="player-copy">
                      <strong className="player-name name-with-avatar">
                        <CharacterArt className="player-avatar" skinId={player.skinId} size={42} alt={getSkinMeta(player.skinId).label} />
                        <span>{player.name}</span>
                      </strong>
                      <div className="player-meta">
                        <span className="player-role">
                          {getSkinMeta(player.skinId).label} · {player.isHost ? "방장" : "참가자"}
                        </span>
                        <span className="player-loadout">
                          {getTrailMeta(player.trailId).emoji} {getTrailMeta(player.trailId).label}
                        </span>
                      </div>
                    </div>
                    <div className="player-actions">
                      <span className={player.isReady ? "progress-pill progress-pill-ready" : "progress-pill"}>
                        {player.isReady ? "준비됨" : "대기중"}
                      </span>
                      {localPlayer?.isHost && !player.isHost ? (
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => kickPlayer(player.sessionId)}
                        >
                          내보내기
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {isCustomizerOpen ? (
            <section className="modal-shell" aria-label="커스터마이즈">
              <button type="button" className="modal-backdrop" aria-label="닫기" onClick={closeCustomizer} />
              <div className="modal-panel">
                <div className="modal-head">
                  <div className="section-copy">
                    <p className="panel-title">커스터마이즈</p>
                    <p>스킨과 트레일을 한 곳에서 구매하고 바로 출전 세팅에 반영하세요.</p>
                  </div>
                  <button type="button" className="ghost-button compact-button" onClick={closeCustomizer}>
                    닫기
                  </button>
                </div>

                <div className="modal-tab-row">
                  <button
                    type="button"
                    className={customizingTab === "skins" ? "choice-meta modal-tab active" : "choice-meta modal-tab"}
                    onClick={() => setCustomizingTab("skins")}
                  >
                    스킨
                  </button>
                  <button
                    type="button"
                    className={customizingTab === "trails" ? "choice-meta modal-tab active" : "choice-meta modal-tab"}
                    onClick={() => setCustomizingTab("trails")}
                  >
                    트레일
                  </button>
                </div>

                <div className="modal-body">
                  {customizingTab === "skins" ? (
                    <div className="cosmetic-list">
                      {selectedCharacterSkins.map((skin) => {
                        const unlocked = profile.unlockedSkins.includes(skin.id);
                        const equipped = profile.equippedSkin === skin.id;

                        return (
                          <button
                            key={skin.id}
                            type="button"
                            className={equipped ? "cosmetic-card selected" : "cosmetic-card"}
                            onClick={() => unlockOrEquipSkin(skin.id)}
                          >
                            <div className="cosmetic-copy cosmetic-copy-with-thumb">
                              <CharacterArt className="cosmetic-thumb" skinId={skin.id} size={52} alt={skin.label} />
                              <div>
                                <strong>
                                  {skin.label} <span className="cosmetic-inline-badge">{skin.badge}</span>
                                </strong>
                                <p>{unlocked ? skin.subtitle : `${skin.price} 코인으로 ${skin.subtitle} 해금`}</p>
                              </div>
                            </div>
                            <span className="progress-pill">
                              {equipped ? "출전 중" : unlocked ? "장착" : `${skin.price}C`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {customizingTab === "trails" ? (
                    <div className="cosmetic-list">
                      {TRAILS.map((trail) => {
                        const unlocked = profile.unlockedTrails.includes(trail.id);
                        const equipped = profile.equippedTrail === trail.id;

                        return (
                          <button
                            key={trail.id}
                            type="button"
                            className={equipped ? "cosmetic-card selected" : "cosmetic-card"}
                            onClick={() => unlockOrEquipTrail(trail.id)}
                          >
                            <div className="cosmetic-copy">
                              <strong>
                                {trail.emoji} {trail.label}
                              </strong>
                              <p>{unlocked ? "즉시 장착 가능" : `${trail.price} 코인으로 해금`}</p>
                            </div>
                            <span className="progress-pill">
                              {equipped ? "장착 중" : unlocked ? "장착" : `${trail.price}C`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </section>
      </main>
    );
  }

  if (roomSnapshot?.phase === "countdown") {
    return (
      <main className="stage-page-shell">
        <section className="stage-page">
          <section className="panel countdown-stage-panel" style={{ marginTop: 24 }}>
            <section className="countdown-stage">
              <p className="countdown-label">출발 준비 완료</p>
              <strong className="countdown-number">{countdownLabel}</strong>
              <p className="countdown-copy">잠시 후 레이스가 시작됩니다. 양손 엄지를 버튼 위에 올려두세요.</p>
            </section>

            <div className="mini-lanes">
              {roomSnapshot.players.map((player) => (
                <article key={player.renderKey} className="mini-lane-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div className="mini-lane-copy" style={{ flex: 1, minWidth: 0 }}>
                    <strong className="name-with-avatar">
                      <CharacterArt className="mini-avatar" skinId={player.skinId} size={28} alt={getSkinMeta(player.skinId).label} />
                      <span>{player.name}</span>
                    </strong>
                    <span>
                      {getSkinMeta(player.skinId).label} · {getTrailMeta(player.trailId).emoji} {getTrailMeta(player.trailId).label}
                    </span>
                  </div>
                  <span className="progress-pill progress-pill-ready">준비 완료</span>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    );
  }

  if (roomSnapshot?.phase === "results") {
    return (
      <main className="stage-page-shell">
        <section className="stage-page">
          <header className="stage-page-header">
            <div className="stage-page-copy">
              <p className="eyebrow">Results</p>
              <h1>{roomSnapshot.roomId}</h1>
              <p>이번 경기 결과와 보상을 확인한 뒤 바로 다음 레이스를 준비할 수 있습니다.</p>
            </div>
          </header>

          <section className="panel results-stage-panel">
            <section className="results-stage">
              <p className="panel-title">최종 순위</p>
              <div className="winner-banner">
                <span>Winner</span>
                <strong className="name-with-avatar">
                  {winner ? (
                    <>
                      <CharacterArt className="winner-avatar" skinId={winner.skinId} size={52} alt={getSkinMeta(winner.skinId).label} />
                      <span>{winner.name}</span>
                    </>
                  ) : (
                    <span>집계 중</span>
                  )}
                </strong>
              </div>
              {localPlayer ? (
                <div className="reward-banner">
                  <span>이번 경기 보상</span>
                  <strong>+{getRaceReward(localPlayer.place)} 코인</strong>
                </div>
              ) : null}
              <div className="results-list">
                {roomSnapshot.players.map((player) => (
                  <article key={player.renderKey} className="result-row">
                    <div className="result-copy">
                      <strong className="name-with-avatar">
                        <CharacterArt className="mini-avatar" skinId={player.skinId} size={28} alt={getSkinMeta(player.skinId).label} />
                        <span>{player.place}위 · {player.name}</span>
                      </strong>
                      <p>
                        {getSkinMeta(player.skinId).label} · {getTrailMeta(player.trailId).emoji} {getTrailMeta(player.trailId).label}
                      </p>
                    </div>
                    <span className="progress-pill">{player.progress.toFixed(0)}m</span>
                  </article>
                ))}
              </div>
              {localPlayer ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => sendReady(true)}
                >
                  다음 경기 바로 준비
                </button>
              ) : null}
            </section>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="hero">
          <p className="eyebrow">Live Race Lobby</p>
          <h1>함수랑 마라톤</h1>
          <p className="hero-copy">
            같은 방에 모인 플레이어가 준비를 마치면 바로 시작되는 실시간 탭 레이스입니다.
            30초 동안 달려 순위를 겨루고, 보상 코인으로 캐릭터를 꾸민 뒤 다음 경기에 다시 도전하세요.
          </p>
        </header>

        {!roomSnapshot ? (
          <section className="panel stack">
            <div className="panel inset intro-panel">
              <div className="section-copy">
                <p className="panel-title">플레이 흐름</p>
                <p>닉네임과 캐릭터를 고른 뒤 방을 만들거나 코드로 입장하면 바로 레이스를 준비할 수 있습니다.</p>
              </div>
              <div className="info-grid">
                <article className="info-card">
                  <span className="info-card-label">입장 방식</span>
                  <strong>방 생성 또는 코드 입장</strong>
                  <p>룸 코드를 공유해 같은 로비에 빠르게 모입니다.</p>
                </article>
                <article className="info-card">
                  <span className="info-card-label">경기 규칙</span>
                  <strong>30초 스프린트</strong>
                  <p>좌우 버튼을 번갈아 눌러 가장 멀리 달리면 승리합니다.</p>
                </article>
                <article className="info-card">
                  <span className="info-card-label">성장 요소</span>
                  <strong>코인으로 스킨 해금</strong>
                  <p>순위 보상으로 캐릭터 스킨과 트레일을 열고 바로 다음 레이스에 반영할 수 있습니다.</p>
                </article>
              </div>
            </div>

            <label className="field">
              <span>레이서 닉네임</span>
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="방에서 표시할 이름"
                maxLength={12}
                name="racerName"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <div className="auth-strip">
              <div className="auth-copy">
                <strong>{auth.playerId ? `${auth.nickname} 계정으로 로그인됨` : "닉네임으로 간편 로그인"}</strong>
                <p>로그인하면 같은 닉네임 계정의 코인과 꾸미기 상태를 그대로 이어받습니다.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void loginWithNickname()}
                disabled={connectionState === "connecting"}
              >
                {auth.playerId ? "다시 로그인" : "로그인"}
              </button>
            </div>

            <div className="panel inset">
              <div className="section-copy">
                <p className="panel-title">출전 캐릭터</p>
                <p>선택한 캐릭터와 꾸미기 상태가 방 안의 다른 참가자 화면에도 그대로 반영됩니다.</p>
              </div>
              <div className="character-grid">
                {PLAYABLE_CHARACTERS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={id === characterId ? "choice selected" : "choice"}
                    onClick={() => selectCharacter(id)}
                  >
                    <CharacterArt
                      className="choice-art"
                      skinId={getDefaultSkinForCharacter(id)}
                      size={88}
                      alt={label}
                    />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => connect("create")}
              disabled={connectionState === "connecting"}
            >
              새 레이스룸 만들기
            </button>

            <div className="join-row">
              <input
                value={joinRoomId}
                onChange={(event) => setJoinRoomId(event.target.value)}
                placeholder="초대받은 룸 코드 입력"
              />
              <button
                type="button"
                className="secondary-button"
                onClick={() => connect("join")}
                disabled={connectionState === "connecting" || !joinRoomId.trim()}
              >
                코드로 입장
              </button>
            </div>

            <div className="panel inset">
              <div className="section-copy">
                <p className="panel-title">활성 레이스룸</p>
                <p>지금 열려 있는 룸을 보고 코드 입력 없이 바로 입장할 수 있습니다.</p>
              </div>
              <div className="room-browser">
                {activeRooms.length === 0 ? (
                  <div className="empty-state">현재 입장 가능한 레이스룸이 없습니다.</div>
                ) : (
                  activeRooms.map((room) => (
                    <article key={room.roomId} className="room-browser-card">
                      <div className="room-browser-copy">
                        <strong>{room.roomId}</strong>
                        <p>
                          {room.hostName} · {room.playerCount}명 · {getStatusLabel(room.phase)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="secondary-button compact-button"
                        onClick={() => joinKnownRoom(room.roomId)}
                      >
                        바로 입장
                      </button>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        <footer className="footer-note" aria-live="polite">
          <span>{toast || "순위에 따라 코인을 얻고, 새로운 코스튬과 트레일을 해금할 수 있습니다."}</span>
        </footer>

        {!roomSnapshot ? (
          <section className="panel stack">
            <div className="section-copy">
              <p className="panel-title">운영자 도구</p>
              <p>활성 레이스룸을 확인하고 문제가 있는 방을 즉시 종료할 수 있습니다.</p>
            </div>
            <div className="room-browser">
              {activeRooms.length === 0 ? (
                <div className="empty-state">운영 중인 룸이 없습니다.</div>
              ) : (
                activeRooms.map((room) => (
                  <article key={`${room.roomId}-admin`} className="room-browser-card">
                    <div>
                      <strong>{room.roomId}</strong>
                      <p>
                        {room.gameMode} · {room.playerCount}명 · {room.hostName}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ghost-button compact-button"
                      onClick={() => void closeRoomByAdmin(room.roomId)}
                    >
                      종료
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

import { startTransition, useEffect, useRef, useState } from "react";

import { Client, Room } from "colyseus.js";

import { RaceTrackPhaser } from "./components/RaceTrackPhaser";
import {
  CHARACTERS,
  DEFAULT_PROFILE,
  HATS,
  SKINS,
  TRAILS,
  getCharacterSkins,
  getDefaultSkinForCharacter,
  getHatMeta,
  getRaceReward,
  getSkinMeta,
  getTrailMeta,
  type CharacterId,
  type CosmeticProfile,
  type HatId,
  type SkinId,
  type TrailId,
} from "./game-data";

type RoomPhase = "lobby" | "countdown" | "racing" | "results";
type GameMode = "sprint";
type InputDirection = "left" | "right";

type PlayerSnapshot = {
  renderKey: string;
  sessionId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  characterId: CharacterId;
  skinId: SkinId;
  hatId: HatId;
  trailId: TrailId;
  progress: number;
  finishMs: number;
  place: number;
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
  hatId?: string;
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

function normalizeCharacterId(value: string | undefined): CharacterId {
  return value === "turtle" ? "turtle" : "surangi";
}

function normalizeHatId(value: string | undefined): HatId {
  return HATS.some((hat) => hat.id === value) ? (value as HatId) : "none";
}

function normalizeSkinId(value: string | undefined, fallbackCharacterId: CharacterId): SkinId {
  return SKINS.some((skin) => skin.id === value)
    ? (value as SkinId)
    : getDefaultSkinForCharacter(fallbackCharacterId);
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
    hatId: normalizeHatId(rawPlayer.hatId),
    trailId: normalizeTrailId(rawPlayer.trailId),
    progress: rawPlayer.progress ?? 0,
    finishMs: rawPlayer.finishMs ?? 0,
    place: rawPlayer.place ?? 0,
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

function formatMs(ms: number) {
  return `${Math.max(0, Math.ceil(ms / 1000))}s`;
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
      equippedHat: normalizeHatId(parsed.equippedHat),
      equippedTrail: normalizeTrailId(parsed.equippedTrail),
      unlockedSkins: (parsed.unlockedSkins ?? memoryProfile.unlockedSkins).map((skinId) =>
        normalizeSkinId(skinId, "surangi"),
      ),
      unlockedHats: (parsed.unlockedHats ?? memoryProfile.unlockedHats).map(normalizeHatId),
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
  const [auth, setAuth] = useState(getSavedAuth);
  const [playerName, setPlayerName] = useState(() => getSavedAuth().nickname || loadProfile().preferredName);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [characterId, setCharacterId] = useState<CharacterId>(() => getSkinMeta(loadProfile().equippedSkin).characterId);
  const [profile, setProfile] = useState<CosmeticProfile>(loadProfile);
  const [countdownLabel, setCountdownLabel] = useState("3s");
  const [raceLabel, setRaceLabel] = useState("30s");
  const [toast, setToast] = useState("");
  const [roomSnapshot, setRoomSnapshot] = useState<RoomSnapshot | null>(null);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected">("idle");

  const roomRef = useRef<Room | null>(null);
  const rewardedRaceRef = useRef<number>(0);

  useEffect(() => {
    persistAuth(auth);
  }, [auth]);

  useEffect(() => {
    if (auth.nickname) {
      setPlayerName(auth.nickname);
    }
  }, [auth.nickname]);

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
          equippedHat: normalizeHatId(nextProfile.equippedHat),
          equippedTrail: normalizeTrailId(nextProfile.equippedTrail),
          unlockedSkins: (nextProfile.unlockedSkins ?? DEFAULT_PROFILE.unlockedSkins).map((skinId) =>
            normalizeSkinId(skinId, "surangi"),
          ),
          unlockedHats: (nextProfile.unlockedHats ?? DEFAULT_PROFILE.unlockedHats).map(normalizeHatId),
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
    const timer = window.setInterval(() => {
      if (!roomSnapshot) {
        return;
      }

      if (roomSnapshot.phase === "countdown") {
        setCountdownLabel(formatMs(roomSnapshot.countdownEndsAt - Date.now()));
      }

      if (roomSnapshot.phase === "racing") {
        setRaceLabel(formatMs(roomSnapshot.raceEndsAt - Date.now()));
      }
    }, 200);

    return () => {
      window.clearInterval(timer);
    };
  }, [roomSnapshot]);

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
      hatId: profile.equippedHat,
      trailId: profile.equippedTrail,
    });
  }, [profile.equippedHat, profile.equippedSkin, profile.equippedTrail, roomSnapshot?.phase]);

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
      const authState = (authRoom.state as { toJSON?: () => { playerId?: string; nickname?: string; isNewUser?: boolean } })?.toJSON?.() ?? {};

      if (!authState.playerId) {
        throw new Error("로그인 정보를 받지 못했습니다.");
      }

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
          : await client.joinById(joinRoomId.trim(), {
              name: playerName.trim(),
            });

      roomRef.current = nextRoom;
      setConnectionState("connected");
      setRoomSnapshot(snapshotRoom(nextRoom));

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
      });

      nextRoom.send("selectCharacter", { characterId });
      nextRoom.send("selectLoadout", {
        skinId: profile.equippedSkin,
        hatId: profile.equippedHat,
        trailId: profile.equippedTrail,
      });
    } catch (error) {
      setConnectionState("idle");
      setToast(error instanceof Error ? error.message : "연결에 실패했습니다.");
    }
  }

  function leaveRoom() {
    roomRef.current?.leave();
    roomRef.current = null;
    setRoomSnapshot(null);
    setConnectionState("idle");
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

  async function closeRoomByAdmin(roomId: string) {
    const response = await fetch(`${getHttpApiBase(serverUrl)}/api/rooms/${roomId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setToast("운영자 도구로 방을 종료했습니다.");
      setActiveRooms((current) => current.filter((room) => room.roomId !== roomId));
    }
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
      try {
        const currentAuth = await ensureAuth();
        if (!currentAuth?.playerId) {
          setConnectionState("idle");
          return;
        }

        const client = new Client(serverUrl);
        const nextRoom = await client.joinById(roomId, {
          name: playerName.trim(),
        });

        roomRef.current = nextRoom;
        setConnectionState("connected");
        setRoomSnapshot(snapshotRoom(nextRoom));

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
        });

        nextRoom.send("selectCharacter", { characterId });
        nextRoom.send("selectLoadout", {
          skinId: profile.equippedSkin,
          hatId: profile.equippedHat,
          trailId: profile.equippedTrail,
        });
      } catch (error) {
        setConnectionState("idle");
        setToast(error instanceof Error ? error.message : "연결에 실패했습니다.");
      }
    })();
  }

  function unlockOrEquipHat(hatId: HatId) {
    const hat = getHatMeta(hatId);

    setProfile((current) => {
      if (!current.unlockedHats.includes(hatId)) {
        if (current.coins < hat.price) {
          setToast("코인이 부족합니다.");
          return current;
        }

        return {
          ...current,
          preferredName: playerName.trim().slice(0, 12),
          coins: current.coins - hat.price,
          unlockedHats: [...current.unlockedHats, hatId],
          equippedHat: hatId,
        };
      }

      return {
        ...current,
        preferredName: playerName.trim().slice(0, 12),
        equippedHat: hatId,
      };
    });
  }

  function unlockOrEquipSkin(skinId: SkinId) {
    const skin = getSkinMeta(skinId);

    setCharacterId(skin.characterId);
    setProfile((current) => {
      if (!current.unlockedSkins.includes(skinId)) {
        if (current.coins < skin.price) {
          setToast("코인이 부족합니다.");
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
                  <p>순위 보상으로 캐릭터 스킨, 모자, 트레일을 열고 바로 다음 레이스에 반영할 수 있습니다.</p>
                </article>
              </div>
            </div>

            <div className="wallet-strip wallet-strip-compact">
              <article className="wallet-card">
                <span>보유 코인</span>
                <strong>{profile.coins}</strong>
              </article>
              <article className="wallet-card">
                <span>현재 출전 세팅</span>
                <strong>
                  {equippedSkinMeta.label}
                </strong>
              </article>
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
                {Object.entries(CHARACTERS).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    className={key === characterId ? "choice selected" : "choice"}
                    onClick={() => selectCharacter(key as CharacterId)}
                  >
                    <img className="choice-art" src={value.imagePath} alt={value.label} />
                    <span>{value.label}</span>
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
        ) : (
          <>
            <section className="panel room-summary">
              <div className="room-summary-copy">
                <p className="eyebrow">ROOM</p>
                <strong>{roomSnapshot.roomId}</strong>
                <p className="room-copy">룸 코드를 공유하면 다른 참가자가 같은 레이스룸으로 바로 입장합니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={leaveRoom}>
                나가기
              </button>
            </section>

            <section className="panel stack">
              <div className="summary-grid">
                <article className="summary-card">
                  <span className="summary-label">현재 상태</span>
                  <strong>{getStatusLabel(roomSnapshot.phase)}</strong>
                </article>
                <article className="summary-card">
                  <span className="summary-label">참가 인원</span>
                  <strong>{roomSnapshot.players.length}명</strong>
                </article>
                {roomSnapshot.phase === "countdown" ? (
                  <article className="summary-card summary-card-accent">
                    <span className="summary-label">시작까지</span>
                    <strong>{countdownLabel}</strong>
                  </article>
                ) : null}
                {roomSnapshot.phase === "racing" ? (
                  <article className="summary-card summary-card-accent">
                    <span className="summary-label">남은 시간</span>
                    <strong>{raceLabel}</strong>
                  </article>
                ) : null}
              </div>

              <div className="wallet-strip lobby-stats">
                <article className="wallet-card wallet-card-stat">
                  <span>보유 코인</span>
                  <strong>{profile.coins}</strong>
                </article>
                <article className="wallet-card wallet-card-stat">
                  <span>장착 스킨</span>
                  <strong>{equippedSkinMeta.badge}</strong>
                </article>
                <article className="wallet-card wallet-card-stat">
                  <span>이펙트</span>
                  <strong className="wallet-icon">
                    {getHatMeta(profile.equippedHat).emoji} {getTrailMeta(profile.equippedTrail).emoji}
                  </strong>
                </article>
              </div>

              {roomSnapshot.phase === "lobby" ? (
                <>
                  <div className="panel inset">
                    <div className="section-copy">
                      <p className="panel-title">게임 모드</p>
                      <p>방장이 경기 방식을 고르면, 참가자 준비가 끝나는 즉시 카운트다운이 시작됩니다.</p>
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
                      <p className="panel-title">내 캐릭터 세팅</p>
                      <p>선택 캐릭터에 맞는 스킨, 모자, 트레일을 준비하면 레이스 시작과 함께 다른 참가자에게 그대로 보입니다.</p>
                    </div>
                    <div className="character-grid">
                      {Object.entries(CHARACTERS).map(([key, value]) => (
                        <button
                          key={key}
                          type="button"
                          className={localPlayer?.characterId === key ? "choice character-choice selected" : "choice character-choice"}
                          onClick={() => selectCharacter(key as CharacterId)}
                        >
                          <img className="choice-art" src={value.imagePath} alt={value.label} />
                          <span className="choice-copy">
                            <strong>{value.label}</strong>
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="locker-grid">
                      <div className="locker-column">
                        <div className="section-copy">
                          <p className="panel-title">캐릭터 스킨</p>
                          <p>{CHARACTERS[selectedCharacterId].label} 전용 베리에이션을 해금하고 출전 스킨으로 장착하세요.</p>
                        </div>
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
                                  <img
                                    className="cosmetic-thumb"
                                    src={CHARACTERS[skin.characterId].imagePath}
                                    alt={skin.label}
                                  />
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
                      </div>

                      <div className="locker-column">
                        <div className="section-copy">
                          <p className="panel-title">모자 꾸미기</p>
                          <p>코인으로 해금하고 바로 장착할 수 있습니다.</p>
                        </div>
                        <div className="cosmetic-list">
                          {HATS.map((hat) => {
                            const unlocked = profile.unlockedHats.includes(hat.id);
                            const equipped = profile.equippedHat === hat.id;

                            return (
                              <button
                                key={hat.id}
                                type="button"
                                className={equipped ? "cosmetic-card selected" : "cosmetic-card"}
                                onClick={() => unlockOrEquipHat(hat.id)}
                              >
                                <div className="cosmetic-copy">
                                  <strong>
                                    {hat.emoji} {hat.label}
                                  </strong>
                                  <p>{unlocked ? "즉시 장착 가능" : `${hat.price} 코인으로 해금`}</p>
                                </div>
                                <span className="progress-pill">
                                  {equipped ? "장착 중" : unlocked ? "장착" : `${hat.price}C`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="locker-column">
                        <div className="section-copy">
                          <p className="panel-title">트레일 꾸미기</p>
                          <p>레이스 중 캐릭터 뒤에 남는 효과입니다.</p>
                        </div>
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
                      </div>
                    </div>
                  </div>

                  <div className="panel inset">
                    <div className="section-head">
                      <div className="section-copy">
                        <p className="panel-title">참가자 현황</p>
                        <p>준비가 완료된 참가자가 모이면 자동으로 다음 레이스가 시작됩니다.</p>
                      </div>
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
                    <div className="player-list">
                      {roomSnapshot.players.map((player) => (
                        <article key={player.renderKey} className="player-card">
                          <div className="player-copy">
                            <strong className="player-name name-with-avatar">
                              <img className="player-avatar" src={CHARACTERS[player.characterId].imagePath} alt={CHARACTERS[player.characterId].label} />
                              <span>{player.name}</span>
                            </strong>
                            <div className="player-meta">
                              <span className="player-role">
                                {getSkinMeta(player.skinId).label} · {player.isHost ? "방장" : "참가자"}
                              </span>
                              <span className="player-loadout">
                                {getHatMeta(player.hatId).emoji} {getTrailMeta(player.trailId).emoji}
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
                </>
              ) : null}

              {roomSnapshot.phase === "countdown" ? (
                <section className="countdown-stage">
                  <p className="countdown-label">출발 준비 완료</p>
                  <strong className="countdown-number">{countdownLabel}</strong>
                  <p className="countdown-copy">잠시 후 레이스가 시작됩니다. 양손 엄지를 버튼 위에 올려두세요.</p>
                  <div className="mini-lanes">
                    {roomSnapshot.players.map((player) => (
                      <article key={player.renderKey} className="mini-lane-card">
                        <div className="mini-lane-copy">
                          <strong className="name-with-avatar">
                            <img className="mini-avatar" src={CHARACTERS[player.characterId].imagePath} alt={CHARACTERS[player.characterId].label} />
                            <span>{player.name}</span>
                          </strong>
                          <span>
                            {getSkinMeta(player.skinId).badge} · {getHatMeta(player.hatId).emoji} {getTrailMeta(player.trailId).emoji}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {roomSnapshot.phase === "results" ? (
                <section className="results-stage">
                  <p className="panel-title">최종 순위</p>
                  <div className="winner-banner">
                    <span>Winner</span>
                    <strong className="name-with-avatar">
                      {winner ? (
                        <>
                          <img className="winner-avatar" src={CHARACTERS[winner.characterId].imagePath} alt={CHARACTERS[winner.characterId].label} />
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
                            <img className="mini-avatar" src={CHARACTERS[player.characterId].imagePath} alt={CHARACTERS[player.characterId].label} />
                            <span>{player.place}위 · {player.name}</span>
                          </strong>
                          <p>
                            {getSkinMeta(player.skinId).label} · {getHatMeta(player.hatId).emoji} ·{" "}
                            {getTrailMeta(player.trailId).emoji}
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
              ) : null}
            </section>

            {roomSnapshot.phase === "racing" ? (
              <section className="panel race-stage">
                <div className="track-header">
                  <div>
                    <p className="panel-title">실시간 레이스</p>
                    <p className="stage-copy">Phaser 씬 위에서 실시간 진행도를 보며 좌우 버튼을 번갈아 탭하세요.</p>
                  </div>
                  <span className="result-badge">{raceLabel}</span>
                </div>

                <RaceTrackPhaser players={racingPlayers} />

                <div className="input-deck">
                  <button type="button" className="tap-button" onPointerDown={() => sendInput("left")}>
                    LEFT
                  </button>
                  <button type="button" className="tap-button" onPointerDown={() => sendInput("right")}>
                    RIGHT
                  </button>
                </div>
              </section>
            ) : null}
          </>
        )}

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

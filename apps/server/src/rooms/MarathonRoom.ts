import { Room } from "colyseus";

import {
  MarathonRoomState,
  type GameMode,
  type RoomPhase,
} from "./schema/MarathonRoomState.js";
import {
  PlayerState,
  type InputDirection,
} from "./schema/PlayerState.js";
import { removeRoom, upsertRoom } from "./roomRegistry.js";

type JoinOptions = {
  name?: string;
};

type RuntimeInputState = {
  lastInputAt: number;
  turnDirection: -1 | 1;
};

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const COUNTDOWN_MS = 3000;
const RACE_DURATION_MS = 30000;
const MAX_PROGRESS = 100;
const MIN_INPUT_INTERVAL_MS = 80;
const MAX_NICKNAME_LENGTH = 12;
const RACE_TICK_MS = 16;
const LATERAL_LIMIT = 50;
const BASE_FORWARD_SPEED = 22;
const TURN_SPEED_DEG_PER_SECOND = 220;
const LATERAL_SPEED = 4.8;

export class MarathonRoom extends Room<MarathonRoomState> {
  maxClients = MAX_PLAYERS;
  private createdAt = new Date().toISOString();
  private countdownMinPlayers = MIN_PLAYERS;

  private countdownTimer?: ReturnType<typeof setTimeout>;
  private raceTimer?: ReturnType<typeof setTimeout>;
  private raceLoopTimer?: ReturnType<typeof setInterval>;
  private runtimeInputs = new Map<string, RuntimeInputState>();

  onCreate() {
    this.setState(new MarathonRoomState());
    this.state.raceDurationMs = RACE_DURATION_MS;
    this.syncRegistry();

    this.onMessage("selectGame", (client, payload: { gameMode: GameMode }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player?.isHost || this.state.phase !== "lobby") {
        return;
      }

      this.state.gameMode = payload.gameMode;
      this.syncRegistry();
      this.broadcast("toast", {
        message: `${player.name}님이 게임 모드를 ${payload.gameMode}로 설정했습니다.`,
      });
    });

    this.onMessage(
      "selectCharacter",
      (client, payload: { characterId: "surangi" | "turtle" }) => {
        const player = this.state.players.get(client.sessionId);
        if (!player || this.state.phase !== "lobby") {
          return;
        }

        player.characterId = payload.characterId;
      },
    );

    this.onMessage(
      "selectLoadout",
      (
        client,
        payload: {
          skinId: string;
          trailId: "mint" | "spark" | "flame" | "petal";
        },
      ) => {
        const player = this.state.players.get(client.sessionId);
        if (!player || this.state.phase !== "lobby") {
          return;
        }

        player.skinId = payload.skinId;
        player.trailId = payload.trailId;
        this.syncRegistry();
      },
    );

    this.onMessage("kickPlayer", (client, payload: { sessionId: string }) => {
      const host = this.state.players.get(client.sessionId);
      if (!host?.isHost || this.state.phase !== "lobby") {
        return;
      }

      if (payload.sessionId === client.sessionId) {
        return;
      }

      const targetClient = this.clients.find(
        (roomClient) => roomClient.sessionId === payload.sessionId,
      );

      targetClient?.leave(4001, "Removed by host");
    });

    this.onMessage("setReady", (client, payload: { ready: boolean }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        return;
      }

      if (this.state.phase === "results") {
        this.resetToLobby();
      }

      player.isReady = payload.ready;
      this.syncRegistry();

      if (!this.canStartCountdown()) {
        this.cancelCountdown();
        this.state.phase = "lobby";
        this.syncRegistry();
        return;
      }

      if (this.state.phase === "lobby") {
        this.startCountdown();
      }
    });

    this.onMessage("startSoloPreview", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player?.isHost || this.state.phase !== "lobby" || this.state.players.size !== 1) {
        return;
      }

      player.isReady = true;
      this.startCountdown(1);
      this.broadcast("toast", {
        message: "혼자 테스트 레이스를 시작합니다.",
      });
    });

    this.onMessage(
      "inputStep",
      (client, payload: { direction: InputDirection; clientSentAt?: number }) => {
        if (this.state.phase !== "racing") {
          return;
        }

        const player = this.state.players.get(client.sessionId);
        if (!player) {
          return;
        }

        const now = Date.now();
        const runtimeState = this.runtimeInputs.get(client.sessionId) ?? {
          lastInputAt: 0,
          turnDirection: -1,
        };

        const interval = now - runtimeState.lastInputAt;
        if (interval < MIN_INPUT_INTERVAL_MS) {
          return;
        }

        runtimeState.lastInputAt = now;
        runtimeState.turnDirection = (runtimeState.turnDirection === 1 ? -1 : 1) as -1 | 1;
        this.runtimeInputs.set(client.sessionId, runtimeState);
        player.turnDirection = runtimeState.turnDirection;
      },
    );

    this.setMetadata({ game: "hamsurang-marathon" });
  }

  onJoin(client: { sessionId: string }, options: JoinOptions) {
    if (this.state.phase !== "lobby") {
      throw new Error("Race already in progress.");
    }

    const player = new PlayerState();
    const trimmedName = options.name?.trim().slice(0, MAX_NICKNAME_LENGTH);
    player.sessionId = client.sessionId;
    player.name = trimmedName || `Runner-${this.clients.length}`;
    player.isHost = this.state.players.size === 0;
    player.isConnected = true;
    this.state.players.set(client.sessionId, player);
    this.runtimeInputs.set(client.sessionId, {
      lastInputAt: 0,
      turnDirection: -1,
    });

    this.broadcast("toast", {
      message: `${player.name}님이 입장했습니다.`,
    });
    this.syncRegistry();
  }

  async onLeave(client: { sessionId: string }, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (!player) {
      return;
    }

    this.state.players.delete(client.sessionId);
    this.runtimeInputs.delete(client.sessionId);

    if (player.isHost) {
      this.assignNextHost();
    }

    if (this.state.phase === "countdown" && !this.canStartCountdown()) {
      this.cancelCountdown();
      this.state.phase = "lobby";
      this.syncRegistry();
    }

    if (this.state.phase === "racing") {
      this.finishRaceIfComplete();
    }

    this.broadcast("toast", {
      message: `${player.name}님이 ${consented ? "방을 나갔습니다" : "연결이 끊겼습니다"}.`,
    });

    if (this.state.players.size === 0) {
      this.disconnect();
      removeRoom(this.roomId);
      return;
    }

    this.syncRegistry();
  }

  onDispose() {
    this.cancelCountdown();
    if (this.raceTimer) {
      clearTimeout(this.raceTimer);
    }
    if (this.raceLoopTimer) {
      clearInterval(this.raceLoopTimer);
    }
    removeRoom(this.roomId);
  }

  private assignNextHost() {
    const nextPlayer = this.state.players.values().next().value as
      | PlayerState
      | undefined;
    if (!nextPlayer) {
      return;
    }

    nextPlayer.isHost = true;
  }

  private canStartCountdown(requiredPlayers = this.countdownMinPlayers) {
    if (this.state.players.size < requiredPlayers) {
      return false;
    }

    for (const player of this.state.players.values()) {
      if (!player.isReady) {
        return false;
      }
    }

    return true;
  }

  private startCountdown(requiredPlayers = MIN_PLAYERS) {
    this.cancelCountdown();
    this.countdownMinPlayers = requiredPlayers;
    this.state.phase = "countdown";
    this.state.countdownStartedAt = Date.now();
    this.state.countdownEndsAt = this.state.countdownStartedAt + COUNTDOWN_MS;
    this.syncRegistry();
    this.broadcast("countdown", { endsAt: this.state.countdownEndsAt });

    this.countdownTimer = setTimeout(() => {
      if (!this.canStartCountdown(requiredPlayers)) {
        this.state.phase = "lobby";
        this.syncRegistry();
        return;
      }

      this.startRace();
    }, COUNTDOWN_MS);
  }

  private cancelCountdown() {
    if (!this.countdownTimer) {
      return;
    }

    clearTimeout(this.countdownTimer);
    this.countdownTimer = undefined;
    this.countdownMinPlayers = MIN_PLAYERS;
    this.broadcast("countdownCanceled", {});
  }

  private startRace() {
    this.state.phase = "racing";
    this.state.raceStartedAt = Date.now();
    this.state.raceEndsAt = this.state.raceStartedAt + this.state.raceDurationMs;
    this.state.winnerSessionId = "";
    this.syncRegistry();

    for (const player of this.state.players.values()) {
      player.progress = 0;
      player.headingDeg = 0;
      player.lateralOffset = 0;
      player.finishMs = 0;
      player.place = 0;
      player.isReady = false;
    }

    this.runtimeInputs.clear();
    for (const sessionId of this.state.players.keys()) {
      this.runtimeInputs.set(sessionId, {
        lastInputAt: 0,
        turnDirection: -1,
      });
    }

    this.broadcast("raceStarted", { endsAt: this.state.raceEndsAt });
    let lastTickAt = Date.now();
    this.raceLoopTimer = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.max(0.016, (now - lastTickAt) / 1000);
      lastTickAt = now;
      this.stepRace(deltaSeconds, now);
    }, RACE_TICK_MS);
    this.raceTimer = setTimeout(() => {
      this.finishRace();
    }, this.state.raceDurationMs);
  }

  private finishRaceIfComplete() {
    const activePlayers = [...this.state.players.values()];
    const finishedPlayers = activePlayers.filter((player) => player.finishMs > 0);

    if (finishedPlayers.length === 0) {
      return;
    }

    if (finishedPlayers.length === activePlayers.length) {
      this.finishRace();
    }
  }

  private finishRace() {
    if (this.raceTimer) {
      clearTimeout(this.raceTimer);
      this.raceTimer = undefined;
    }
    if (this.raceLoopTimer) {
      clearInterval(this.raceLoopTimer);
      this.raceLoopTimer = undefined;
    }

    this.state.phase = "results";
    const now = Date.now();
    const players = [...this.state.players.values()].sort((left, right) => {
      const leftValue = left.finishMs > 0 ? MAX_PROGRESS + (RACE_DURATION_MS - left.finishMs) / 1000 : left.progress;
      const rightValue =
        right.finishMs > 0 ? MAX_PROGRESS + (RACE_DURATION_MS - right.finishMs) / 1000 : right.progress;

      return rightValue - leftValue;
    });

    players.forEach((player, index) => {
      player.place = index + 1;
      if (player.finishMs === 0) {
        player.finishMs = now - this.state.raceStartedAt;
      }
    });

    this.state.winnerSessionId = players[0]?.sessionId ?? "";
    this.syncRegistry();
    this.broadcast("raceFinished", {
      winnerSessionId: this.state.winnerSessionId,
    });
  }

  private resetToLobby() {
    this.cancelCountdown();
    if (this.raceTimer) {
      clearTimeout(this.raceTimer);
      this.raceTimer = undefined;
    }
    if (this.raceLoopTimer) {
      clearInterval(this.raceLoopTimer);
      this.raceLoopTimer = undefined;
    }

    this.state.phase = "lobby";
    this.state.countdownStartedAt = 0;
    this.state.countdownEndsAt = 0;
    this.state.raceStartedAt = 0;
    this.state.raceEndsAt = 0;
    this.state.winnerSessionId = "";
    this.countdownMinPlayers = MIN_PLAYERS;
    this.syncRegistry();

    for (const player of this.state.players.values()) {
      player.progress = 0;
      player.headingDeg = 0;
      player.lateralOffset = 0;
      player.finishMs = 0;
      player.place = 0;
      player.isReady = false;
    }
  }

  private stepRace(deltaSeconds: number, now: number) {
    let didAnyPlayerFinish = false;

    for (const player of this.state.players.values()) {
      if (player.finishMs > 0) {
        continue;
      }

      const runtimeState = this.runtimeInputs.get(player.sessionId) ?? {
        lastInputAt: 0,
        turnDirection: -1,
      };

      // Compute velocity from CURRENT heading first, then update heading (symplectic Euler)
      const headingRadians = (player.headingDeg * Math.PI) / 180;
      const forwardVelocity = Math.cos(headingRadians) * BASE_FORWARD_SPEED;
      const lateralVelocity = Math.sin(headingRadians) * LATERAL_SPEED;

      player.headingDeg = Number(
        (((player.headingDeg + runtimeState.turnDirection * TURN_SPEED_DEG_PER_SECOND * deltaSeconds) % 360) + 360) % 360,
      );

      player.progress = Number(
        Math.max(0, Math.min(MAX_PROGRESS, player.progress + forwardVelocity * deltaSeconds)).toFixed(2),
      );
      player.lateralOffset = Number(
        Math.max(-LATERAL_LIMIT, Math.min(LATERAL_LIMIT, player.lateralOffset + lateralVelocity * deltaSeconds))
          .toFixed(3),
      );
      if (player.progress >= MAX_PROGRESS) {
        player.progress = MAX_PROGRESS;
        player.finishMs = now - this.state.raceStartedAt;
        didAnyPlayerFinish = true;
      }
    }

    if (didAnyPlayerFinish) {
      this.finishRaceIfComplete();
    }
  }

  private syncRegistry() {
    const hostPlayer = [...this.state.players.values()].find((player) => player.isHost);

    upsertRoom(
      this.roomId,
      {
        roomId: this.roomId,
        phase: this.state.phase,
        gameMode: this.state.gameMode,
        playerCount: this.state.players.size,
        hostName: hostPlayer?.name ?? "대기 중",
        createdAt: this.createdAt,
      },
      () => this.disconnect(),
    );
  }
}

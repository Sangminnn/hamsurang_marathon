import { MapSchema, Schema, type } from "@colyseus/schema";

import { PlayerState } from "./PlayerState.js";

export type RoomPhase =
  | "lobby"
  | "countdown"
  | "racing"
  | "results";

export type GameMode = "sprint";

export class MarathonRoomState extends Schema {
  @type("string") phase: RoomPhase = "lobby";
  @type("string") gameMode: GameMode = "sprint";
  @type("number") countdownStartedAt = 0;
  @type("number") countdownEndsAt = 0;
  @type("number") raceStartedAt = 0;
  @type("number") raceEndsAt = 0;
  @type("number") raceDurationMs = 30000;
  @type("string") winnerSessionId = "";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}

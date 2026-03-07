import { Schema, type } from "@colyseus/schema";

export type InputDirection = "left" | "right";

export class PlayerState extends Schema {
  @type("string") declare sessionId: string;
  @type("string") declare name: string;
  @type("boolean") isHost = false;
  @type("boolean") isReady = false;
  @type("boolean") isConnected = true;
  @type("string") characterId = "surangi";
  @type("string") skinId = "surangi-classic";
  @type("string") trailId = "mint";
  @type("number") progress = 0;
  @type("number") headingDeg = 0;
  @type("number") lateralOffset = 0;
  @type("number") finishMs = 0;
  @type("number") place = 0;
}

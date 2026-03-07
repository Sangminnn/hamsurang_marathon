import { Schema, type } from "@colyseus/schema";

export class AuthState extends Schema {
  @type("string") playerId = "";
  @type("string") nickname = "";
  @type("boolean") isNewUser = false;
}

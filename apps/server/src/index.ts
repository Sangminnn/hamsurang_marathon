import http from "node:http";

import { Server } from "colyseus";
import cors from "cors";
import express from "express";

import { AuthRoom } from "./rooms/AuthRoom.js";
import { MarathonRoom } from "./rooms/MarathonRoom.js";
import { closeRoom, listRooms } from "./rooms/roomRegistry.js";
import { getProfile, saveProfile } from "./storage/profileStore.js";

const PORT = Number(process.env.PORT ?? 2567);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/profile/:playerId", async (request, response) => {
  const profile = await getProfile(request.params.playerId);
  response.json(profile);
});

app.get("/api/rooms", (_request, response) => {
  response.json(listRooms());
});

app.delete("/api/rooms/:roomId", (request, response) => {
  const closed = closeRoom(request.params.roomId);
  response.status(closed ? 200 : 404).json({ ok: closed });
});

app.put("/api/profile/:playerId", async (request, response) => {
  const body = request.body as {
    preferredName?: string;
    coins?: number;
    equippedSkin?:
      | "surangi-classic"
      | "surangi-detective"
      | "surangi-rainbow"
      | "surangi-mechanic"
      | "surangi-sun"
      | "surangi-skater"
      | "surangi-snack"
      | "surangi-soccer"
      | "turtle-classic"
      | "turtle-coder"
      | "turtle-sprint";
    equippedHat?: "none" | "cap" | "crown" | "leaf" | "visor";
    equippedTrail?: "mint" | "spark" | "flame" | "petal";
    unlockedSkins?: Array<
      | "surangi-classic"
      | "surangi-detective"
      | "surangi-rainbow"
      | "surangi-mechanic"
      | "surangi-sun"
      | "surangi-skater"
      | "surangi-snack"
      | "surangi-soccer"
      | "turtle-classic"
      | "turtle-coder"
      | "turtle-sprint"
    >;
    unlockedHats?: Array<"none" | "cap" | "crown" | "leaf" | "visor">;
    unlockedTrails?: Array<"mint" | "spark" | "flame" | "petal">;
  };

  const profile = await saveProfile(request.params.playerId, {
    preferredName: body.preferredName?.slice(0, 12) ?? "",
    coins: Math.max(0, Number(body.coins ?? 0)),
    equippedSkin: body.equippedSkin ?? "surangi-classic",
    equippedHat: body.equippedHat ?? "cap",
    equippedTrail: body.equippedTrail ?? "mint",
    unlockedSkins: Array.from(new Set(body.unlockedSkins ?? ["surangi-classic", "turtle-classic"])),
    unlockedHats: Array.from(new Set(body.unlockedHats ?? ["none", "cap"])),
    unlockedTrails: Array.from(new Set(body.unlockedTrails ?? ["mint"])),
  });

  response.json(profile);
});

const server = http.createServer(app);
const gameServer = new Server({
  server,
});

gameServer.define("marathon", MarathonRoom);
gameServer.define("auth", AuthRoom);

gameServer.listen(PORT);

console.log(`Colyseus server listening on ws://localhost:${PORT}`);

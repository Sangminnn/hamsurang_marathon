import type { GameMode, RoomPhase } from "./schema/MarathonRoomState.js";

type ManagedRoom = {
  roomId: string;
  metadata: RoomSummary;
  disconnect: () => void;
};

export type RoomSummary = {
  roomId: string;
  phase: RoomPhase;
  gameMode: GameMode;
  playerCount: number;
  hostName: string;
  createdAt: string;
};

const managedRooms = new Map<string, ManagedRoom>();

export function upsertRoom(
  roomId: string,
  metadata: RoomSummary,
  disconnect: () => void,
) {
  managedRooms.set(roomId, {
    roomId,
    metadata,
    disconnect,
  });
}

export function removeRoom(roomId: string) {
  managedRooms.delete(roomId);
}

export function listRooms() {
  return [...managedRooms.values()]
    .map((entry) => entry.metadata)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function closeRoom(roomId: string) {
  const target = managedRooms.get(roomId);
  if (!target) {
    return false;
  }

  target.disconnect();
  managedRooms.delete(roomId);
  return true;
}

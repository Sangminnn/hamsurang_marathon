import { Client, Room } from "colyseus";

import { loginByNickname } from "../storage/profileStore.js";
import { AuthState } from "./schema/AuthState.js";

type JoinOptions = {
  nickname?: string;
};

export class AuthRoom extends Room<AuthState> {
  maxClients = 1;
  autoDispose = true;

  onCreate() {
    this.setState(new AuthState());
  }

  async onJoin(client: Client, options: JoinOptions) {
    const nickname = options.nickname?.trim().slice(0, 12);
    if (!nickname) {
      throw new Error("Nickname is required.");
    }

    const result = await loginByNickname(nickname);
    this.state.playerId = result.playerId;
    this.state.nickname = result.profile.preferredName;
    this.state.isNewUser = result.isNewUser;

    setTimeout(() => {
      this.send(client, "authenticated", {
        playerId: result.playerId,
        nickname: result.profile.preferredName,
        isNewUser: result.isNewUser,
      });
    }, 30);

    setTimeout(() => {
      client.leave();
      this.disconnect();
    }, 180);
  }
}

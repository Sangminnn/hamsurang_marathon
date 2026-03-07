import { useEffect, useRef } from "react";

import { CHARACTERS, getHatMeta, getSkinMeta, getTrailMeta, type CharacterId, type HatId, type SkinId, type TrailId } from "../game-data";

type RacePlayer = {
  renderKey: string;
  name: string;
  characterId: CharacterId;
  skinId: SkinId;
  hatId: HatId;
  trailId: TrailId;
  progress: number;
  place: number;
  isLocal: boolean;
};

type SceneSnapshot = {
  players: RacePlayer[];
};

export function RaceTrackPhaser({ players }: { players: RacePlayer[] }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{ refresh: (snapshot: SceneSnapshot) => void } | null>(null);

  useEffect(() => {
    let destroyed = false;
    let game: { destroy: (removeCanvas: boolean, noReturn?: boolean) => void } | null = null;

    async function bootstrap() {
      const Phaser = await import("phaser");
      if (destroyed || !hostRef.current) {
        return;
      }

      class MarathonScene extends Phaser.Scene {
        private current: SceneSnapshot = { players: [] };

        preload() {
          Object.entries(CHARACTERS).forEach(([characterId, meta]) => {
            if (!this.textures.exists(meta.sceneKey)) {
              this.load.image(meta.sceneKey, meta.imagePath);
            }
          });
        }

        refresh(snapshot: SceneSnapshot) {
          this.current = snapshot;
          this.renderSnapshot();
        }

        create() {
          this.cameras.main.setBackgroundColor("#eff8f2");
          this.renderSnapshot();
        }

        private renderSnapshot() {
          const { width, height } = this.scale;
          this.children.removeAll();

          this.add.rectangle(width / 2, height / 2, width, height, 0xeef8f2);
          this.add.rectangle(width / 2, 38, width - 36, 52, 0x18392f, 0.08);
          this.add.text(26, 26, "실시간 트랙", {
            color: "#17382e",
            fontFamily: "Pretendard Variable, sans-serif",
            fontSize: "18px",
            fontStyle: "700",
          });

          this.current.players.forEach((player, index) => {
            const laneTop = 88 + index * 86;
            const trailMeta = getTrailMeta(player.trailId);
            const hatMeta = getHatMeta(player.hatId);
            const charMeta = CHARACTERS[player.characterId];
            const skinMeta = getSkinMeta(player.skinId);
            const runnerX = 42 + ((width - 96) * player.progress) / 100;

            this.add.rectangle(width / 2, laneTop + 30, width - 32, 64, 0xffffff, 0.96).setStrokeStyle(
              player.isLocal ? 2 : 1,
              player.isLocal ? 0x4fad83 : 0xd6e5da,
            );

            this.add.text(24, laneTop, `${player.name}`, {
              color: "#18392f",
              fontFamily: "Pretendard Variable, sans-serif",
              fontSize: "16px",
              fontStyle: "700",
            });

            this.add.text(width - 196, laneTop, `${skinMeta.badge} · ${hatMeta.emoji} ${trailMeta.emoji}`, {
              color: "#527269",
              fontFamily: "Pretendard Variable, sans-serif",
              fontSize: "14px",
            });

            this.add.rectangle(width / 2, laneTop + 38, width - 120, 14, 0xddebe2, 1);
            this.add.rectangle(42 + (width - 120) / 2, laneTop + 38, width - 120, 14, 0xddebe2, 1)
              .setOrigin(0.5, 0.5);

            this.add.rectangle(42 + ((width - 120) * player.progress) / 2, laneTop + 38, ((width - 120) * player.progress) / 100, 14, trailMeta.color, 0.35)
              .setOrigin(0, 0.5);

            this.add.circle(runnerX, laneTop + 38, 28, skinMeta.tint, 0.22);
            this.add.circle(runnerX, laneTop + 38, 20, trailMeta.color, 0.18);
            this.add.image(runnerX, laneTop + 34, charMeta.sceneKey).setDisplaySize(42, 42).setTint(skinMeta.tint);

            if (player.place > 0) {
              this.add.text(width - 52, laneTop + 22, `${player.place}위`, {
                color: "#18392f",
                fontFamily: "Pretendard Variable, sans-serif",
                fontSize: "14px",
                fontStyle: "700",
              });
            }
          });
        }
      }

      const scene = new MarathonScene();
      sceneRef.current = {
        refresh: (snapshot) => scene.refresh(snapshot),
      };

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 468,
        height: Math.max(300, 120 + players.length * 86),
        parent: hostRef.current,
        transparent: true,
        scene,
        scale: {
          mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });

      sceneRef.current.refresh({ players });
    }

    bootstrap();

    return () => {
      destroyed = true;
      sceneRef.current = null;
      game?.destroy(true);
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.refresh({ players });
  }, [players]);

  return <div ref={hostRef} className="phaser-stage" />;
}

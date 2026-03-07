import { useEffect, useRef } from "react";

import { getSkinMeta, getTrailMeta, SKINS, type ArtSource, type CharacterId, type SkinId, type TrailId } from "../game-data";

type RacePlayer = {
  renderKey: string;
  name: string;
  characterId: CharacterId;
  skinId: SkinId;
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
          const imageEntries = new Map<string, string>();
          SKINS.forEach(({ id: skinId }) => {
            const art = getSkinMeta(skinId).art;
            imageEntries.set(art.imagePath, art.imagePath);
          });

          imageEntries.forEach((path, key) => {
            if (!this.textures.exists(key)) {
              this.load.image(key, path);
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

        private drawArt(art: ArtSource, x: number, y: number, size: number, tint?: number) {
          const textureKey = art.kind === "image" ? art.imagePath : art.imagePath;
          const image = this.add.image(x, y, textureKey);
          if (art.kind === "sheet") {
            image.setCrop(art.crop.x, art.crop.y, art.crop.width, art.crop.height);
          }
          image.setDisplaySize(size, size);
          if (tint && tint !== 0xffffff) {
            image.setTint(tint);
          }
          return image;
        }

        private renderSnapshot() {
          const { width, height } = this.scale;
          this.children.removeAll();

          const startX = 74;
          const finishX = width - 72;
          const trackTop = 132;
          const trackBottom = height - 74;
          const trackHeight = trackBottom - trackTop;
          const laneOffsets = [-72, -32, 8, 48, 88, -104, 118, -2];

          this.add.rectangle(width / 2, height / 2, width, height, 0xe8f4ec);
          this.add.rectangle(width / 2, 88, width, 176, 0xdaf0e3, 1);
          this.add.ellipse(width * 0.2, 96, 190, 76, 0xffffff, 0.34);
          this.add.ellipse(width * 0.78, 126, 240, 84, 0xffffff, 0.28);
          this.add.rectangle(width / 2, trackBottom + 34, width, 120, 0xc4ddcc, 1);
          this.add.rectangle(width / 2, (trackTop + trackBottom) / 2, width - 34, trackHeight, 0xf7eee1, 1)
            .setStrokeStyle(2, 0xe0d0bc, 0.9);
          this.add.rectangle(startX, (trackTop + trackBottom) / 2, 8, trackHeight + 12, 0x2d5f4b, 0.8);
          this.add.rectangle(finishX, (trackTop + trackBottom) / 2, 10, trackHeight + 12, 0x17382e, 0.9);

          for (let i = 0; i < 7; i += 1) {
            const y = trackTop + ((trackHeight / 6) * i);
            this.add.line(width / 2, y, startX + 12, y, finishX - 12, y, 0xffffff, 0.18).setLineWidth(2, 2);
          }

          this.add.text(26, 26, "Arena Race", {
            color: "#17382e",
            fontFamily: "Pretendard Variable, sans-serif",
            fontSize: "16px",
            fontStyle: "700",
          });
          this.add.text(26, 52, "같은 트랙 위에서 서로 부딪치듯 추월합니다.", {
            color: "#527269",
            fontFamily: "Pretendard Variable, sans-serif",
            fontSize: "14px",
          });
          this.add.text(startX - 8, trackTop - 36, "START", {
            color: "#2d5f4b",
            fontFamily: "Pretendard Variable, sans-serif",
            fontSize: "14px",
            fontStyle: "700",
          }).setOrigin(0.5, 0.5);
          this.add.text(finishX, trackTop - 36, "FINISH", {
            color: "#17382e",
            fontFamily: "Pretendard Variable, sans-serif",
            fontSize: "14px",
            fontStyle: "700",
          }).setOrigin(0.5, 0.5);

          [...this.current.players]
            .sort((left, right) => {
              if (left.progress === right.progress) {
                return left.renderKey.localeCompare(right.renderKey);
              }

              return left.progress - right.progress;
            })
            .forEach((player, index) => {
            const trailMeta = getTrailMeta(player.trailId);
            const skinMeta = getSkinMeta(player.skinId);
            const y = trackTop + trackHeight / 2 + laneOffsets[index % laneOffsets.length];
            const x = startX + ((finishX - startX - 18) * player.progress) / 100;

            this.add.ellipse(x + 6, y + 50, 76, 20, 0x80674e, 0.18);
            this.add.circle(x - 34, y + 38, 7, trailMeta.color, 0.4);
            this.add.circle(x - 50, y + 40, 5, trailMeta.color, 0.24);
            this.add.circle(x - 64, y + 42, 3, trailMeta.color, 0.14);
            this.add.circle(x, y + 18, player.isLocal ? 42 : 34, trailMeta.color, player.isLocal ? 0.18 : 0.12);
            this.drawArt(skinMeta.art, x, y + 8, player.isLocal ? 92 : 84, skinMeta.tint);
            const tag = this.add.container(x, y - 70);
            const badgeWidth = Math.max(92, player.name.length * 12 + 52);
            const tagBg = this.add.rectangle(0, 0, badgeWidth, 30, player.isLocal ? 0x224c3d : 0xffffff, player.isLocal ? 0.94 : 0.9)
              .setStrokeStyle(1, player.isLocal ? 0x4fad83 : 0xd7e5dc, 1);
            const tagText = this.add.text(0, 0, `${player.place || index + 1}위 ${player.name}`, {
              color: player.isLocal ? "#ffffff" : "#17382e",
              fontFamily: "Pretendard Variable, sans-serif",
              fontSize: "13px",
              fontStyle: "700",
            }).setOrigin(0.5, 0.5);
            tag.add([tagBg, tagText]);
          });
        }
      }

      const scene = new MarathonScene();
      sceneRef.current = {
        refresh: (snapshot) => scene.refresh(snapshot),
      };

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 760,
        height: 560,
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

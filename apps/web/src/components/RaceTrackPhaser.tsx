import { useEffect, useRef } from "react";

import { getSkinMeta, getTrailMeta, SKINS, type ArtSource, type CharacterId, type SkinId, type TrailId } from "../game-data";

type RacePlayer = {
  renderKey: string;
  name: string;
  characterId: CharacterId;
  skinId: SkinId;
  trailId: TrailId;
  progress: number;
  headingDeg: number;
  lateralOffset: number;
  place: number;
  isLocal: boolean;
};

type SceneSnapshot = {
  players: RacePlayer[];
};

export function RaceTrackPhaser({ players }: { players: RacePlayer[] }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{ refresh: (snapshot: SceneSnapshot) => void } | null>(null);
  const playersRef = useRef(players);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    let destroyed = false;
    let game: {
      destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
      scale?: { resize: (width: number, height: number) => void };
    } | null = null;
    let resizeObserver: ResizeObserver | null = null;

    function getSceneSize() {
      const hostWidth = hostRef.current?.clientWidth ?? 360;
      const isMobile = window.innerWidth < 768;
      const width = Math.max(320, hostWidth);
      return {
        width,
        height: isMobile ? Math.round(width * 1.18) : Math.round(width * 0.62),
      };
    }

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

        private drawSteerArrow(x: number, y: number, headingDeg: number, color: number) {
          const graphics = this.add.graphics();
          const curveStrength = Math.max(-1, Math.min(1, headingDeg / 34));
          const arcWidth = 18 + Math.abs(curveStrength) * 12;
          const arcHeight = 14 + Math.abs(curveStrength) * 6;
          const direction = curveStrength >= 0 ? 1 : -1;
          const startX = x - arcWidth * 0.5 * direction;
          const controlX = x + arcWidth * 0.22 * direction;
          const endX = x + arcWidth * 0.5 * direction;
          const endY = y - arcHeight * 0.2;
          const arrowPath = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(startX, y),
            new Phaser.Math.Vector2(controlX, y - arcHeight),
            new Phaser.Math.Vector2(endX, endY),
          );

          graphics.lineStyle(2, color, 0.96);
          graphics.strokePoints(arrowPath.getPoints(14));
          graphics.fillStyle(color, 0.96);
          graphics.beginPath();
          graphics.moveTo(endX, endY);
          graphics.lineTo(endX - 6 * direction, endY - 4);
          graphics.lineTo(endX - 6 * direction, endY + 4);
          graphics.closePath();
          graphics.fillPath();
        }

        private renderSnapshot() {
          const { width, height } = this.scale;
          this.children.removeAll();
          const isMobile = width < 560;
          const orderedPlayers = [...this.current.players].sort((left, right) =>
            left.renderKey.localeCompare(right.renderKey),
          );
          const laneCount = Math.max(orderedPlayers.length, 1);
          const outerPadding = isMobile ? 14 : 22;
          const headerHeight = isMobile ? 40 : 52;
          const trackLeft = outerPadding + 22;
          const trackRight = width - outerPadding - 22;
          const trackTop = outerPadding + headerHeight + 12;
          const trackBottom = height - outerPadding - 16;
          const trackWidth = trackRight - trackLeft;
          const trackHeight = trackBottom - trackTop;
          const laneHeight = trackHeight / laneCount;
          const startX = trackLeft + Math.max(24, trackWidth * 0.08);
          const finishX = trackRight - Math.max(24, trackWidth * 0.1);
          const runnerSize = Math.max(
            isMobile ? 32 : 40,
            Math.min(isMobile ? 58 : 76, laneHeight * (isMobile ? 0.5 : 0.58)),
          );
          const labelFontSize = isMobile ? "11px" : "13px";

          this.add.rectangle(width / 2, height / 2, width, height, 0xe8f4ec);
          this.add.ellipse(width * 0.22, 76, isMobile ? 150 : 220, isMobile ? 58 : 84, 0xffffff, 0.34);
          this.add.ellipse(width * 0.78, 92, isMobile ? 170 : 250, isMobile ? 56 : 84, 0xffffff, 0.22);
          this.add.rectangle(width / 2, trackBottom + 30, width, isMobile ? 88 : 110, 0xc7dfcf, 1);
          this.add.rectangle(width / 2, (trackTop + trackBottom) / 2, width - outerPadding * 2, trackHeight + 26, 0xd7ebdd, 0.92)
            .setStrokeStyle(1, 0xc6ddce, 0.9);
          this.add.rectangle(width / 2, (trackTop + trackBottom) / 2, trackWidth, trackHeight, 0xf6ecdf, 1)
            .setStrokeStyle(2, 0xe2d2c0, 0.92);

          for (let index = 0; index <= laneCount; index += 1) {
            const y = trackTop + laneHeight * index;
            this.add.line(width / 2, y, trackLeft, y, trackRight, y, 0xffffff, index === 0 || index === laneCount ? 0.22 : 0.34)
              .setLineWidth(2, 2);
          }

          for (let marker = 1; marker < 5; marker += 1) {
            const markerX = startX + ((finishX - startX) * marker) / 5;
            this.add.line(markerX, (trackTop + trackBottom) / 2, markerX, trackTop + 10, markerX, trackBottom - 10, 0xffffff, 0.18)
              .setLineWidth(2, 2);
          }

          this.add.rectangle(startX, (trackTop + trackBottom) / 2, isMobile ? 5 : 7, trackHeight + 8, 0x2d5f4b, 0.82);
          this.add.rectangle(finishX, (trackTop + trackBottom) / 2, isMobile ? 8 : 10, trackHeight + 8, 0x17382e, 0.92);
          this.add.text(startX, trackTop - 18, "START", {
            color: "#2d5f4b",
            fontFamily: "Pretendard Variable, sans-serif",
            fontSize: labelFontSize,
            fontStyle: "700",
          }).setOrigin(0.5, 0.5);
          this.add.text(finishX, trackTop - 18, "FINISH", {
            color: "#17382e",
            fontFamily: "Pretendard Variable, sans-serif",
            fontSize: labelFontSize,
            fontStyle: "700",
          }).setOrigin(0.5, 0.5);

          orderedPlayers.forEach((player, index) => {
            const trailMeta = getTrailMeta(player.trailId);
            const skinMeta = getSkinMeta(player.skinId);
            const laneCenterY = trackTop + laneHeight * index + laneHeight / 2;
            const laneDriftLimit = Math.max(10, laneHeight * 0.26);
            const centerY = laneCenterY + player.lateralOffset * laneDriftLimit;
            const x = startX + ((finishX - startX - runnerSize * 0.16) * player.progress) / 100;
            const shadowWidth = runnerSize * 0.92;
            const shadowHeight = Math.max(8, runnerSize * 0.22);
            const tagTextValue = `${player.place || index + 1}위 ${player.name}`;
            const tagWidth = Math.max(isMobile ? 74 : 90, tagTextValue.length * (isMobile ? 7.2 : 8.4) + 22);

            this.add.ellipse(x, centerY + runnerSize * 0.42, shadowWidth, shadowHeight, 0x7f654a, 0.14);
            this.add.circle(x - runnerSize * 0.82, centerY + runnerSize * 0.14, Math.max(2, runnerSize * 0.12), trailMeta.color, 0.34);
            this.add.circle(x - runnerSize * 1.08, centerY + runnerSize * 0.16, Math.max(2, runnerSize * 0.08), trailMeta.color, 0.22);
            this.add.circle(x - runnerSize * 1.32, centerY + runnerSize * 0.18, Math.max(1, runnerSize * 0.05), trailMeta.color, 0.14);
            this.drawArt(skinMeta.art, x, centerY, runnerSize, skinMeta.tint)
              .setRotation((player.headingDeg * Math.PI) / 1800);
            this.drawSteerArrow(
              x,
              centerY - runnerSize * 0.92,
              player.headingDeg,
              player.isLocal ? 0x1d5a46 : 0x608277,
            );

            const tag = this.add.container(x, centerY - runnerSize * 1.26);
            const tagBg = this.add.rectangle(0, 0, tagWidth, isMobile ? 22 : 26, player.isLocal ? 0x224c3d : 0xffffff, player.isLocal ? 0.96 : 0.92)
              .setStrokeStyle(1, player.isLocal ? 0x4fad83 : 0xd6e5db, 1);
            const tagText = this.add.text(0, 0, tagTextValue, {
              color: player.isLocal ? "#ffffff" : "#17382e",
              fontFamily: "Pretendard Variable, sans-serif",
              fontSize: isMobile ? "10px" : "12px",
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

      const initialSize = getSceneSize();

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: initialSize.width,
        height: initialSize.height,
        parent: hostRef.current,
        transparent: true,
        scene,
        scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
      });

      sceneRef.current.refresh({ players });

      resizeObserver = new ResizeObserver(() => {
        if (!game?.scale || !sceneRef.current) {
          return;
        }

        const nextSize = getSceneSize();
        game.scale.resize(nextSize.width, nextSize.height);
        sceneRef.current.refresh({ players: playersRef.current });
      });

      resizeObserver.observe(hostRef.current);
    }

    bootstrap();

    return () => {
      destroyed = true;
      resizeObserver?.disconnect();
      sceneRef.current = null;
      game?.destroy(true);
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.refresh({ players });
  }, [players]);

  return <div ref={hostRef} className="phaser-stage" />;
}

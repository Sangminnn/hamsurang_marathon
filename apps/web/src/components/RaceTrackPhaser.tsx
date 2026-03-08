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
  turnDirection: number;
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
        private ready = false;

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
          if (this.ready) {
            this.renderSnapshot();
          }
        }

        create() {
          this.cameras.main.setBackgroundColor("#eff8f2");

          SKINS.forEach(({ id: skinId }) => {
            const art = getSkinMeta(skinId).art;
            if (art.kind === "sheet") {
              try {
                const texture = this.textures.get(art.imagePath);
                if (texture && !texture.has(skinId)) {
                  texture.add(skinId, 0, art.crop.x, art.crop.y, art.crop.width, art.crop.height);
                }
              } catch { /* skip */ }
            }
          });

          this.ready = true;
          this.renderSnapshot();
        }

        private drawArt(art: ArtSource, x: number, y: number, size: number, skinId: string, tint?: number) {
          let image: Phaser.GameObjects.Image;

          if (art.kind === "sheet") {
            const texture = this.textures.get(art.imagePath);
            if (texture && texture.has(skinId)) {
              image = this.add.image(x, y, art.imagePath, skinId);
              const fitScale = size / Math.max(art.crop.width, art.crop.height);
              image.setDisplaySize(art.crop.width * fitScale, art.crop.height * fitScale);
            } else {
              image = this.add.image(x, y, art.imagePath);
              image.setCrop(art.crop.x, art.crop.y, art.crop.width, art.crop.height);
              image.setDisplaySize(size, size);
            }
          } else {
            image = this.add.image(x, y, art.imagePath);
            image.setDisplaySize(size, size);
          }

          if (tint && tint !== 0xffffff) {
            image.setTint(tint);
          }
          return image;
        }

        private drawSteerArrow(cx: number, cy: number, headingDeg: number, color: number, radius: number, turnDir: number) {
          const graphics = this.add.graphics();
          const r = radius * 0.58;
          const headRad = (headingDeg * Math.PI) / 180;

          // Curved arc: start behind heading, end ahead in turn direction
          const tailOffset = Math.PI * 0.15;
          const tipOffset = Math.PI * 0.05;
          const startAngle = headRad - tailOffset * turnDir;
          const endAngle = headRad + tipOffset * turnDir;
          const midAngle = (startAngle + endAngle) / 2;

          const sx = cx + Math.cos(startAngle) * r;
          const sy = cy + Math.sin(startAngle) * r;
          const ex = cx + Math.cos(endAngle) * r;
          const ey = cy + Math.sin(endAngle) * r;

          // Control point bulges outward for the curve
          const bulge = 1.45;
          const controlX = cx + Math.cos(midAngle) * r * bulge;
          const controlY = cy + Math.sin(midAngle) * r * bulge;

          const pts = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(sx, sy),
            new Phaser.Math.Vector2(controlX, controlY),
            new Phaser.Math.Vector2(ex, ey),
          ).getPoints(16);

          graphics.lineStyle(2.5, color, 0.85);
          graphics.strokePoints(pts);

          // Arrowhead at the END of the curve, aligned to incoming tangent
          const last = pts[pts.length - 1];
          const secondLast = pts[pts.length - 2];
          const tangentAngle = Math.atan2(last.y - secondLast.y, last.x - secondLast.x);

          const chevronSize = 5;
          const chevronSpread = 0.5;
          graphics.lineStyle(2.5, color, 0.9);
          graphics.beginPath();
          graphics.moveTo(
            last.x + Math.cos(tangentAngle + Math.PI - chevronSpread) * chevronSize,
            last.y + Math.sin(tangentAngle + Math.PI - chevronSpread) * chevronSize,
          );
          graphics.lineTo(last.x, last.y);
          graphics.lineTo(
            last.x + Math.cos(tangentAngle + Math.PI + chevronSpread) * chevronSize,
            last.y + Math.sin(tangentAngle + Math.PI + chevronSpread) * chevronSize,
          );
          graphics.strokePath();
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

          // World is 2.5x viewport width; vertical stays the same
          const worldWidth = Math.round(width * 3);
          const trackLeft = outerPadding + 22;
          const trackRight = worldWidth - outerPadding - 22;
          const trackTop = outerPadding + headerHeight + 12;
          const trackBottom = height - outerPadding - 16;
          const trackWidth = trackRight - trackLeft;
          const trackHeight = trackBottom - trackTop;
          const laneHeight = trackHeight / laneCount;
          const startX = trackLeft + Math.max(24, trackWidth * 0.04);
          const finishX = trackRight - Math.max(24, trackWidth * 0.04);
          const runnerSize = Math.max(
            isMobile ? 20 : 26,
            Math.min(isMobile ? 36 : 46, laneHeight * (isMobile ? 0.32 : 0.36)),
          );
          const labelFontSize = isMobile ? "11px" : "13px";

          // Background fills the entire world
          this.add.rectangle(worldWidth / 2, height / 2, worldWidth, height, 0xe8f4ec);
          this.add.rectangle(worldWidth / 2, trackBottom + 30, worldWidth, isMobile ? 88 : 110, 0xc7dfcf, 1);
          this.add.rectangle(worldWidth / 2, (trackTop + trackBottom) / 2, worldWidth - outerPadding * 2, trackHeight + 26, 0xd7ebdd, 0.92)
            .setStrokeStyle(1, 0xc6ddce, 0.9);
          this.add.rectangle(worldWidth / 2, (trackTop + trackBottom) / 2, trackWidth, trackHeight, 0xf6ecdf, 1)
            .setStrokeStyle(2, 0xe2d2c0, 0.92);

          for (let index = 0; index <= laneCount; index += 1) {
            const y = trackTop + laneHeight * index;
            this.add.line(0, 0, trackLeft, y, trackRight, y, 0xffffff, index === 0 || index === laneCount ? 0.22 : 0.34)
              .setLineWidth(2, 2).setOrigin(0, 0);
          }

          // Distance markers every 10%
          for (let marker = 1; marker < 10; marker += 1) {
            const markerX = startX + ((finishX - startX) * marker) / 10;
            this.add.line(0, 0, markerX, trackTop + 10, markerX, trackBottom - 10, 0xffffff, 0.18)
              .setLineWidth(2, 2).setOrigin(0, 0);
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

          let localPlayerX = startX;

          orderedPlayers.forEach((player, index) => {
            const trailMeta = getTrailMeta(player.trailId);
            const skinMeta = getSkinMeta(player.skinId);
            const laneCenterY = trackTop + laneHeight * index + laneHeight / 2;
            const pixelsPerProgress = (finishX - startX) / 100;
            const laneDriftLimit = pixelsPerProgress * (7.3 / 1.3);
            const rawCenterY = laneCenterY + player.lateralOffset * laneDriftLimit;
            const centerY = Math.max(trackTop + runnerSize * 0.6, Math.min(trackBottom - runnerSize * 0.6, rawCenterY));
            const x = startX + ((finishX - startX - runnerSize * 0.16) * player.progress) / 100;
            const shadowWidth = runnerSize * 0.92;
            const shadowHeight = Math.max(8, runnerSize * 0.22);
            this.add.ellipse(x, centerY + runnerSize * 0.42, shadowWidth, shadowHeight, 0x7f654a, 0.14);
            const emojiSize = Math.max(10, Math.round(runnerSize * 0.52));
            const trailPositions = [
              { dx: -0.62, dy: 0.08, scale: 1.0, alpha: 0.7 },
              { dx: -1.00, dy: 0.12, scale: 0.78, alpha: 0.5 },
              { dx: -1.36, dy: 0.14, scale: 0.56, alpha: 0.3 },
            ];
            for (const tp of trailPositions) {
              const fontSize = Math.round(emojiSize * tp.scale);
              this.add.text(x + runnerSize * tp.dx, centerY + runnerSize * tp.dy, trailMeta.emoji, {
                fontSize: `${fontSize}px`,
              }).setOrigin(0.5, 0.5).setAlpha(tp.alpha);
            }

            if (player.isLocal) {
              this.add.ellipse(x, centerY + runnerSize * 0.44, runnerSize * 1.2, runnerSize * 0.32, 0x4fad83, 0.28);
              localPlayerX = x;
            }

            this.drawArt(skinMeta.art, x, centerY, runnerSize, player.skinId, skinMeta.tint);

            if (player.isLocal) {
              const markerY = centerY - runnerSize * 0.62;
              const g = this.add.graphics();
              g.fillStyle(0x4fad83, 0.92);
              g.beginPath();
              g.moveTo(x, markerY + 5);
              g.lineTo(x - 4, markerY);
              g.lineTo(x + 4, markerY);
              g.closePath();
              g.fillPath();
            }
            this.drawSteerArrow(
              x,
              centerY,
              player.headingDeg,
              player.isLocal ? 0x1d5a46 : 0x608277,
              runnerSize,
              player.turnDirection,
            );
          });

          // Camera follows local player horizontally, clamped to world bounds
          const cam = this.cameras.main;
          cam.setBounds(0, 0, worldWidth, height);
          const targetScrollX = Math.max(0, Math.min(worldWidth - width, localPlayerX - width * 0.35));
          cam.scrollX = targetScrollX;
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
        scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
      });

      // Track the last applied size so we only resize when truly needed
      let lastAppliedWidth = initialSize.width;
      let lastAppliedHeight = initialSize.height;

      resizeObserver = new ResizeObserver(() => {
        if (!game?.scale || !sceneRef.current) {
          return;
        }

        const nextSize = getSceneSize();

        // Skip if the computed size hasn't actually changed
        if (nextSize.width === lastAppliedWidth && nextSize.height === lastAppliedHeight) {
          return;
        }

        lastAppliedWidth = nextSize.width;
        lastAppliedHeight = nextSize.height;

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

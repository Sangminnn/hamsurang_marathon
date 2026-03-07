import type { CSSProperties } from "react";

import { getSkinMeta, type SkinId } from "../game-data";

type CharacterArtProps = {
  skinId: SkinId;
  size: number;
  alt: string;
  className?: string;
};

export function CharacterArt({ skinId, size, alt, className }: CharacterArtProps) {
  const art = getSkinMeta(skinId).art;

  if (art.kind === "image") {
    return (
      <img
        className={className}
        src={art.imagePath}
        alt={alt}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  const scale = size / Math.max(art.crop.width, art.crop.height);
  const width = art.sheetWidth * scale;
  const height = art.sheetHeight * scale;
  const left = -art.crop.x * scale + (size - art.crop.width * scale) / 2;
  const top = -art.crop.y * scale + (size - art.crop.height * scale) / 2;

  return (
    <span
      className={className}
      role="img"
      aria-label={alt}
      style={
        {
          width: size,
          height: size,
          position: "relative",
          display: "inline-block",
          overflow: "hidden",
          flex: "0 0 auto",
        } satisfies CSSProperties
      }
    >
      <img
        src={art.imagePath}
        alt=""
        aria-hidden="true"
        style={
          {
            position: "absolute",
            width,
            height,
            maxWidth: "none",
            left,
            top,
            userSelect: "none",
            pointerEvents: "none",
          } satisfies CSSProperties
        }
      />
    </span>
  );
}

import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { FAMILJEN } from "../fonts";
import { COLORS, LAYOUT } from "../constants";

/** The spoken line, set large in the right-hand column beside the phone. One line per caption. */
export const Caption: React.FC<{ text: string; local: number; size?: number }> = ({ text, local, size = 46 }) => {
  const { fps } = useVideoConfig();
  const prog = spring({ frame: local, fps, config: { mass: 0.6, damping: 16, stiffness: 140 } });
  const opacity = interpolate(prog, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(prog, [0, 1], [14, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: LAYOUT.textX,
        width: LAYOUT.textW,
        top: 0,
        height: 1080,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 26, opacity, transform: `translateY(${y}px)` }}>
        <div style={{ width: 6, alignSelf: "stretch", background: COLORS.accent, borderRadius: 3 }} />
        <div
          style={{
            fontFamily: FAMILJEN,
            fontWeight: 500,
            fontSize: size,
            lineHeight: 1.22,
            letterSpacing: "-0.01em",
            color: COLORS.ink1,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

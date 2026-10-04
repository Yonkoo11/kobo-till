import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FAMILJEN } from "../fonts";
import { Phone } from "../components/Phone";
import { SceneAudio } from "../components/SceneAudio";
import { AUDIO_DURATIONS, AUDIO_FILES, COLORS, END, LAYOUT } from "../constants";

/** Closes on the real Welcome screen, with the headline and the repo link beside it. */
export const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - 10, fps, config: { mass: 0.8, damping: 18, stiffness: 110 } });
  const op = interpolate(t, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const x = interpolate(t, [0, 1], [-24, 0]);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ground }}>
      <Phone src={END.still} still />
      <div
        style={{
          position: "absolute",
          left: LAYOUT.textX,
          width: LAYOUT.textW,
          top: 0,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          opacity: op,
          transform: `translateX(${x}px)`,
          fontFamily: FAMILJEN,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 132, lineHeight: 1, letterSpacing: "-0.03em", color: COLORS.ink1 }}>Kobo</div>
        <div style={{ fontWeight: 500, fontSize: 52, lineHeight: 1.15, letterSpacing: "-0.015em", color: COLORS.ink1, marginTop: 26 }}>
          {END.headline}
        </div>
        <div style={{ fontWeight: 500, fontSize: 34, color: COLORS.accent, marginTop: 44 }}>{END.link}</div>
        <div style={{ fontWeight: 400, fontSize: 26, color: COLORS.ink2, marginTop: 14 }}>{END.credit}</div>
      </div>
      <SceneAudio src={AUDIO_FILES.end} audioDuration={AUDIO_DURATIONS.end} />
    </AbsoluteFill>
  );
};

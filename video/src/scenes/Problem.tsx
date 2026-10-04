import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FAMILJEN } from "../fonts";
import { SceneAudio } from "../components/SceneAudio";
import { AUDIO_DURATIONS, AUDIO_FILES, COLORS, PROBLEM_LINES, SUBTITLES } from "../constants";

/** The only scene with no app footage: three lines of the status quo, landing one after another. */
export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const subs = SUBTITLES.problem as readonly { text: string; start: number; end: number }[];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ground, justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: 1400, display: "flex", flexDirection: "column", gap: 28 }}>
        {PROBLEM_LINES.map((line, i) => {
          // each line appears when its words are spoken (timed from the caption that carries them)
          const at = i === 0 ? subs[0].start : subs[1].start + Math.round(((i - 1) * (subs[1].end - subs[1].start)) / 3);
          const p = spring({ frame: frame - at, fps, config: { mass: 0.7, damping: 17, stiffness: 120 } });
          const op = interpolate(p, [0, 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = interpolate(p, [0, 1], [22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={line}
              style={{
                fontFamily: FAMILJEN,
                fontWeight: i === 0 ? 500 : 600,
                fontSize: i === 0 ? 48 : 76,
                lineHeight: 1.1,
                letterSpacing: i === 0 ? "-0.01em" : "-0.025em",
                color: i === 0 ? COLORS.ink2 : COLORS.ink1,
                opacity: op,
                transform: `translateY(${y}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
      <SceneAudio src={AUDIO_FILES.problem} audioDuration={AUDIO_DURATIONS.problem} />
    </AbsoluteFill>
  );
};

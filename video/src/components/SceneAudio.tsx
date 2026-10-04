import React from "react";
import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { AUDIO_DELAY } from "../constants";

/** One narration slice per scene, starting after the frame has settled, fading at both ends. */
export const SceneAudio: React.FC<{ src: string; audioDuration: number }> = ({ src, audioDuration }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={AUDIO_DELAY}>
      <Audio
        src={staticFile(src)}
        volume={(f) => {
          const inn = interpolate(f, [0, Math.round(fps * 0.08)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const out = interpolate(f, [audioDuration - Math.round(fps * 0.3), audioDuration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return Math.min(inn, out);
        }}
      />
    </Sequence>
  );
};

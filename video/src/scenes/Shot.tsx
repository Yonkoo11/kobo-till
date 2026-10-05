import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { Phone } from "../components/Phone";
import { SceneAudio } from "../components/SceneAudio";
import { FAMILJEN } from "../fonts";
import { AUDIO_DURATIONS, AUDIO_FILES, COLORS, LAYOUT, SHOTS, SUBTITLES } from "../constants";

type Key = keyof typeof SHOTS;

/** A phone recording (or still) on the left, the spoken line on the right. Every clip scene uses this. */
export const Shot: React.FC<{ shot: Key }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { src, from, still, note, mark } = SHOTS[shot];
  const subs = SUBTITLES[shot];
  const active = subs.find((s) => frame >= s.start && frame < s.end);
  const { x, y, w, h } = LAYOUT.phone;
  const m = mark ? spring({ frame: frame - mark.at, fps, config: { mass: 0.6, damping: 15, stiffness: 140 } }) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ground }}>
      <Phone src={src} from={from} still={still} />
      {mark ? (
        <div
          style={{
            position: "absolute",
            left: mark.x,
            top: mark.y,
            width: mark.w,
            height: mark.h,
            borderRadius: 8,
            border: `3px solid ${COLORS.accent}`,
            opacity: interpolate(m, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
            transform: `scale(${interpolate(m, [0, 1], [1.12, 1])})`,
          }}
        />
      ) : null}
      {note ? (
        <div
          style={{
            position: "absolute",
            left: x,
            width: w,
            top: y + h + 8,
            textAlign: "center",
            fontFamily: FAMILJEN,
            fontWeight: 500,
            fontSize: 22,
            color: COLORS.ink2,
          }}
        >
          {note}
        </div>
      ) : null}
      <SceneAudio src={AUDIO_FILES[shot]} audioDuration={AUDIO_DURATIONS[shot]} />
      {active ? <Caption text={active.text} local={frame - active.start} /> : null}
    </AbsoluteFill>
  );
};

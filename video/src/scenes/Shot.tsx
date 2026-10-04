import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Phone } from "../components/Phone";
import { SceneAudio } from "../components/SceneAudio";
import { AUDIO_DURATIONS, AUDIO_FILES, COLORS, SHOTS, SUBTITLES } from "../constants";

type Key = keyof typeof SHOTS;

/** A phone recording on the left, the spoken line on the right. Every clip scene uses this. */
export const Shot: React.FC<{ shot: Key }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { src, from } = SHOTS[shot];
  const subs = SUBTITLES[shot] as readonly { text: string; start: number; end: number }[];
  const active = subs.find((s) => frame >= s.start && frame < s.end);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ground }}>
      <Phone src={src} from={from} />
      <SceneAudio src={AUDIO_FILES[shot]} audioDuration={AUDIO_DURATIONS[shot]} />
      {active ? <Caption text={active.text} local={frame - active.start} /> : null}
    </AbsoluteFill>
  );
};

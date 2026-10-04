import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { FAMILJEN } from "./fonts";
import { COLORS, CROSSFADE, SOCIAL, SOCIAL_DURATION } from "./constants";

const Seg: React.FC<{ from: number }> = ({ from }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.ground }}>
    <OffthreadVideo src={staticFile(SOCIAL.src)} trimBefore={from} muted style={{ width: 1080, height: 1920 }} />
  </AbsoluteFill>
);

/** Vertical, silent, about 11 s: three moments of the portrait recording with one line each. */
export const SocialClip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = SOCIAL.subs.find((c) => frame >= c.start && frame < c.end);
  const p = spring({ frame: active ? frame - active.start : 0, fps, config: { mass: 0.6, damping: 16, stiffness: 140 } });
  const op = interpolate(p, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [SOCIAL_DURATION - 20, SOCIAL_DURATION], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const timing = linearTiming({ durationInFrames: CROSSFADE });
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ground, opacity: exit }}>
      <TransitionSeries>
        {SOCIAL.segs.flatMap((g, i) => {
          const el = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={g.dur}>
              <Seg from={g.from} />
            </TransitionSeries.Sequence>,
          ];
          if (i < SOCIAL.segs.length - 1) el.push(<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={timing} />);
          return el;
        })}
      </TransitionSeries>
      {active ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            bottom: 150,
            padding: "26px 32px",
            background: "rgba(21,23,20,0.86)",
            borderRadius: 16,
            fontFamily: FAMILJEN,
            fontWeight: 500,
            fontSize: 54,
            lineHeight: 1.2,
            color: COLORS.slip,
            opacity: op,
          }}
        >
          {active.text}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

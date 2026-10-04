import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Shot } from "./scenes/Shot";
import { Problem } from "./scenes/Problem";
import { End } from "./scenes/End";
import { COLORS, CROSSFADE, SCENE_DURATIONS, SCENE_ORDER, SHOTS } from "./constants";

export const MainVideo: React.FC = () => {
  const timing = linearTiming({ durationInFrames: CROSSFADE });
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ground }}>
      <TransitionSeries>
        {SCENE_ORDER.flatMap((key, i) => {
          const el = [
            <TransitionSeries.Sequence key={key} durationInFrames={SCENE_DURATIONS[key]}>
              {key === "problem" ? <Problem /> : key === "end" ? <End /> : <Shot shot={key as keyof typeof SHOTS} />}
            </TransitionSeries.Sequence>,
          ];
          if (i < SCENE_ORDER.length - 1) {
            el.push(<TransitionSeries.Transition key={`t-${key}`} presentation={fade()} timing={timing} />);
          }
          return el;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

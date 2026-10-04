import React from "react";
import { Img, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, LAYOUT, PLAYBACK_RATE } from "../constants";

/**
 * The real phone recording, inside a rounded phone outline on the left of the frame.
 * Clips are pre-composited to 1920x1080 with the phone already at LAYOUT.phone (see video/encode.sh),
 * so the video is shown at full size and clipped to the phone rect; nothing is stretched.
 */
export const Phone: React.FC<{ src: string; from?: number; still?: boolean }> = ({ src, from = 0, still }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, y, w, h, r } = LAYOUT.phone;
  const p = spring({ frame, fps, config: { mass: 0.8, damping: 18, stiffness: 120 } });
  const lift = interpolate(p, [0, 1], [18, 0]);
  const op = interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        overflow: "hidden",
        opacity: op,
        transform: `translateY(${lift}px)`,
        boxShadow: `0 0 0 1px ${COLORS.rule}, 0 30px 70px -28px rgba(21,23,20,0.45)`,
        backgroundColor: COLORS.slip,
      }}
    >
      {still ? (
        <Img src={staticFile(src)} style={{ position: "absolute", left: -x, top: -y, width: 1920, height: 1080 }} />
      ) : (
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={from}
          muted
          playbackRate={PLAYBACK_RATE}
          style={{ position: "absolute", left: -x, top: -y, width: 1920, height: 1080 }}
        />
      )}
    </div>
  );
};

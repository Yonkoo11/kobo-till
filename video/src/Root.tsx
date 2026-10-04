import React from "react";
import { Composition, registerRoot } from "remotion";
import { MainVideo } from "./MainVideo";
import { SocialClip } from "./SocialClip";
import { FPS, H, SOCIAL_DURATION, SOCIAL_H, SOCIAL_W, TOTAL_FRAMES, W } from "./constants";
import "./fonts";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={MainVideo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Social" component={SocialClip} durationInFrames={SOCIAL_DURATION} fps={FPS} width={SOCIAL_W} height={SOCIAL_H} />
  </>
);

registerRoot(RemotionRoot);

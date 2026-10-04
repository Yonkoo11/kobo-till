// Kobo demo video. Every frame is the real app, recorded on the test phone (see video/STORYBOARD.md).
// Narration: one continuous Gemini TTS take, atempo 1.12, EBU R128 at I=-16, sliced per scene by
// align.py; caption timings come from Whisper word timestamps on that audio (timing.json).
import timing from "../timing.json";

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const PACING_MODE = "gap" as const; // TTS narration, PLAYBACK_RATE stays 1.0 (atempo already applied)
export const PLAYBACK_RATE = 1.0;
export const CROSSFADE = 15;

// The app's own tokens (app/ui/theme.ts). The video sits on the app's paper ground, not a dark template.
export const COLORS = {
  ground: "#ECEEEB",
  slip: "#FFFFFF",
  ink1: "#151714",
  ink2: "rgba(21,23,20,0.62)",
  ink3: "rgba(21,23,20,0.38)",
  rule: "rgba(21,23,20,0.12)",
  accent: "#00774A",
  accentSoft: "#E5F2EC",
};

// Phone rect inside the 1920x1080 frame. encode.sh places every recording here, so clips are never scaled in Remotion.
export const LAYOUT = {
  phone: { x: 240, y: 40, w: 450, h: 1000, r: 30 },
  textX: 820,
  textW: 1000,
};

const s = (sec: number) => Math.round(sec * FPS);

export const VIDEO_FILES = {
  sale: "video/sale.mp4", // emuA3: ₦30,000 typed, QR, paid at +4 s (2026-10-04 09:26)
  after: "video/after.mp4", // emuD: Share receipt, Today, Close the day, Disconnect, Connect wallet (09:29)
} as const;

// scene: [source, start second in the source]. Scene length comes from the narration (SCENE_DURATIONS).
export const SHOTS = {
  hook: { src: VIDEO_FILES.sale, from: s(29.6) }, // Waiting, then the flip to Paid at +2.3 s and the receipt printing
  till: { src: VIDEO_FILES.sale, from: s(4.5) }, // ₦0 → ₦3 → ₦300 → ₦30,000 with the live USDC line
  waiting: { src: VIDEO_FILES.sale, from: s(17.4) }, // QR, rate locked, "Checked hh:mm:ss" ticking
  paid: { src: VIDEO_FILES.after, from: s(1.0) }, // Paid receipt, Share receipt opens at +6 s
  detail: { src: VIDEO_FILES.after, from: s(8.5) }, // the share sheet: receipt text with the Solscan link
  closeday: { src: VIDEO_FILES.after, from: s(22.0) }, // Today with three sales, Close the day summary at +7.3 s
  mwa: { src: VIDEO_FILES.after, from: s(58.0) }, // Welcome, Connect wallet, the wallet's authorize sheet
} as const;

export const AUDIO_DELAY = s(0.4);
type Key = keyof typeof timing.scenes;
const keys = Object.keys(timing.scenes) as Key[];
export const AUDIO_FILES = Object.fromEntries(keys.map((k) => [k, timing.scenes[k].file])) as Record<Key, string>;
export const AUDIO_DURATIONS = Object.fromEntries(keys.map((k) => [k, s(timing.scenes[k].dur)])) as Record<Key, number>;
// Each scene holds its narration slice plus the lead-in and a short tail.
export const SCENE_DURATIONS = Object.fromEntries(
  keys.map((k) => [k, AUDIO_DELAY + AUDIO_DURATIONS[k] + s(0.5)]),
) as Record<Key, number>;
export const SUBTITLES = Object.fromEntries(
  keys.map((k) => [
    k,
    timing.captions[k].map((c) => ({ text: c.text, start: AUDIO_DELAY + s(c.start), end: AUDIO_DELAY + s(c.end) + s(0.25) })),
  ]),
) as Record<Key, { text: string; start: number; end: number }[]>;

export const SCENE_ORDER = ["hook", "problem", "till", "waiting", "paid", "detail", "closeday", "mwa", "end"] as const;

export const TOTAL_FRAMES =
  SCENE_ORDER.reduce((a, k) => a + SCENE_DURATIONS[k], 0) - CROSSFADE * (SCENE_ORDER.length - 1);

export const PROBLEM_LINES = [
  "How a Nigerian shop takes dollars today:",
  "A wallet address pasted into WhatsApp.",
  "No amount. No confirmation.",
  "No receipt.",
] as const;

export const END = {
  still: "assets/welcome.png", // a frame of the real Welcome screen from after.mp4
  headline: "Get paid in digital dollars.",
  link: "github.com/Yonkoo11/kobo-till",
  credit: "Open source. Built for Clock In, Solana Mobile x Radiants.",
} as const;

// Vertical clip: the raw portrait recording, three moments, no audio.
export const SOCIAL_W = 1080;
export const SOCIAL_H = 1920;
export const SOCIAL = {
  src: "video/social.mp4", // sale recording scaled to 864x1920 on the ground colour
  segs: [
    { from: s(5.0), dur: s(3.6) }, // typing the price
    { from: s(18.0), dur: s(3.4) }, // the QR
    { from: s(31.3), dur: s(4.6) }, // the flip to Paid
  ],
  subs: [
    { text: "Type the price in naira.", start: s(0.3), end: s(3.4) },
    { text: "Show the QR. Any Solana wallet pays in USDC.", start: s(3.6), end: s(6.9) },
    { text: "Paid. Receipt printed.", start: s(7.4), end: s(10.6) },
  ],
} as const;
export const SOCIAL_DURATION = SOCIAL.segs.reduce((a, g) => a + g.dur, 0) - CROSSFADE * (SOCIAL.segs.length - 1);

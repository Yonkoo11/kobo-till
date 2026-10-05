// Kobo demo video, judge cut. Every phone frame is the real app on Solana mainnet (see video/STORYBOARD.md).
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

// Judge cut: real mainnet payment, 2026-10-05 19:41 (Lagos time), recorded on two Android emulators with
// Google Play. encode-judge.sh cuts one clip per scene from recA (shop, Kobo) and recB (customer, Phantom).
// Tx 4rFCgZJo…WWFRdBx, block 453662644, 18:41:53 UTC, 0.12 USDC Hnsj…9Cf1 -> BUzv…tjg9.
type ShotDef = {
  src: string;
  from: number;
  still?: boolean;
  note?: string; // small line under the phone, for footage that is sped up or cut down
  mark?: { x: number; y: number; w: number; h: number; at: number }; // highlight box, frame coords, from scene frame `at`
};
export const SHOTS: Record<"hook" | "till" | "waiting" | "pay" | "paid" | "proof" | "closeday", ShotDef> = {
  hook: { src: "video/j-hook.mp4", from: 0 }, // Waiting, the flip to Paid at 4.0 s, the receipt
  till: { src: "video/j-till.mp4", from: 0, note: "Sped up 3×" }, // ₦15 -> ₦150 -> Charge
  waiting: { src: "video/j-waiting.mp4", from: 0 }, // the QR, ₦150 · 0.12 USDC, rate locked at 19:37
  pay: { src: "video/j-pay.mp4", from: 0, note: "Customer's phone · 90 s of taps cut to 10 s" }, // SOL pre-filled, coin switch, 0.12 USDC, Confirm, Sent
  paid: { src: "video/j-paid.mp4", from: 0, mark: { x: 262, y: 366, w: 206, h: 44, at: s(2.2) } }, // "Paid (matched by amount)"
  proof: { src: "assets/solscan.png", from: 0, still: true, note: "solscan.io, the payment above" },
  closeday: { src: "video/j-closeday.mp4", from: 0 }, // Today: ₦150 today, Close the day
};

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

export const SCENE_ORDER = ["hook", "problem", "till", "waiting", "pay", "paid", "proof", "closeday", "end"] as const;

export const TOTAL_FRAMES =
  SCENE_ORDER.reduce((a, k) => a + SCENE_DURATIONS[k], 0) - CROSSFADE * (SCENE_ORDER.length - 1);

export const PROBLEM_LINES = [
  "How a Nigerian shop takes dollars today:",
  "A wallet address pasted into WhatsApp.",
  "No amount. No confirmation.",
  "No receipt.",
] as const;

export const END = {
  still: "assets/paid-end.png", // the real Paid receipt from recA (mainnet)
  headline: "Get paid in digital dollars.",
  link: "github.com/Yonkoo11/kobo-till",
  credit: "Open source. Built for Clock In, Solana Mobile x Radiants.",
} as const;

// Vertical clip: the raw portrait recording, three moments, no audio.
export const SOCIAL_W = 1080;
export const SOCIAL_H = 1920;
export const SOCIAL = {
  src: "video/j-social.mp4", // recA (mainnet): typing ₦150, the QR, the flip to Paid, joined by encode-judge.sh
  segs: [
    { from: s(0), dur: s(3.6) }, // ₦15 -> ₦150
    { from: s(3.6), dur: s(3.4) }, // the QR, ₦150 · 0.12 USDC
    { from: s(7.0), dur: s(4.6) }, // the flip to Paid
  ],
  subs: [
    { text: "Type the price in naira.", start: s(0.3), end: s(3.4) },
    { text: "Show the QR. The customer pays in USDC.", start: s(3.6), end: s(6.9) },
    { text: "Paid, on Solana mainnet.", start: s(7.4), end: s(10.6) },
  ],
} as const;
export const SOCIAL_DURATION = SOCIAL.segs.reduce((a, g) => a + g.dur, 0) - CROSSFADE * (SOCIAL.segs.length - 1);

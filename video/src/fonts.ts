import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// The app's own typeface (app/ui/theme.ts), loaded from the same TTF files the phone uses.
export const FAMILJEN = "Familjen Grotesk";

const weights: Array<[string, string]> = [
  ["400", "FamiljenGrotesk_400Regular.ttf"],
  ["500", "FamiljenGrotesk_500Medium.ttf"],
  ["600", "FamiljenGrotesk_600SemiBold.ttf"],
];

export const fontsReady = Promise.all(
  weights.map(([weight, file]) =>
    loadFont({ family: FAMILJEN, url: staticFile(`fonts/${file}`), weight }),
  ),
);

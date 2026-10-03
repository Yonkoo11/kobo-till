// Direction A, Till receipt (design/direction.md, design/build-brief.md). Components read `t` only.
import { Easing, Platform } from 'react-native'

// Tier 1: base values. Nothing outside this file uses them.
const base = {
  grey100: '#ECEEEB',
  white: '#FFFFFF',
  ink: '#151714',
  green700: '#00774A',
  green50: '#E5F2EC',
  amber700: '#8A5300',
  amber50: '#FFF3DC',
  red700: '#B3261E',
  red50: '#FCEBEA',
}

// Tier 2: semantic tokens.
export const t = {
  ground: base.grey100,
  slip: base.white,
  ink1: base.ink,
  ink2: 'rgba(21,23,20,0.62)',
  ink3: 'rgba(21,23,20,0.38)',
  rule: 'rgba(21,23,20,0.12)',
  accent: base.green700,
  accentInk: base.white,
  accentSoft: base.green50,
  warn: base.amber700,
  warnSoft: base.amber50,
  danger: base.red700,
  dangerSoft: base.red50,
  /** 4px step; n * 4. Allowed results: 2, 4, 8, 12, 16, 24, 32, 48. */
  space: (n: number) => n * 4,
  radius: { slip: 4, control: 12, chip: 999 },
  tap: 56,
  font: {
    regular: 'FamiljenGrotesk_400Regular',
    medium: 'FamiljenGrotesk_500Medium',
    semibold: 'FamiljenGrotesk_600SemiBold',
  },
  size: {
    meta: { fontSize: 14, lineHeight: 20 },
    body: { fontSize: 16, lineHeight: 24 },
    coin: { fontSize: 20, lineHeight: 28 },
    title: { fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
    amount: { fontSize: 56, lineHeight: 62, letterSpacing: -1.2 },
  },
  zigzag: { tooth: 12, depth: 6 },
  motion: {
    ease: Easing.bezier(0.2, 0.8, 0.2, 1),
    pressMs: 160,
    printMs: 700,
    printFrom: -24,
    checkMs: 400,
  },
  shadowSlip: Platform.select({
    android: { elevation: 2 },
    default: { shadowColor: base.ink, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  }),
}

# Kobo design system

Extracted from the code as built (`app/ui/theme.ts`, `app/ui/kit.tsx`), 2026-10-05. Direction A, "Till receipt"
(design/direction.md). Nothing here is a value the code does not use, except where marked "declared, not used".
The web-measured design gate last exited 1 on one motion budget that its CSS measurement cannot read on a
React Native app (ai/design-progress.md, 2026-10-04); this file documents the native build.

## Identity

A paper till slip on a counter: white slips with a torn zigzag bottom edge on a grey-green ground, black ink,
one green for money that arrived. Green (#00774A) is the colour of Paid and of the one primary action on a
screen, so a glance across the counter reads the state. The signature device is the receipt slip with its
zigzag edge (12 px teeth, 6 px deep), used for the price, the QR, the receipt and the day's roll.

## Tokens

Colours
- ground `#ECEEEB`, slip `#FFFFFF`
- ink1 `#151714`, ink2 `rgba(21,23,20,0.62)`, ink3 `rgba(21,23,20,0.38)`, rule `rgba(21,23,20,0.12)`
- accent `#00774A`, accentInk `#FFFFFF`, accentSoft `#E5F2EC`
- warn `#8A5300` on `#FFF3DC`; danger `#B3261E` on `#FCEBEA`

Type: Familjen Grotesk 400 / 500 / 600 (bundled TTF, same files in the app, the deck and the video). Fixed
sizes, no clamp() (native app):
- meta 14/20, body 16/24, coin 20/28, title 32/38 (-0.3), amount 56/62 (-1.2)

Spacing: 4 px step; used results 2, 4, 8, 12, 16, 24, 32, 48. Tap target 56 px.

Radius by role: slip 4, control 12, chip 999.

## Craft

- Radius scale (CF-1): 4 for paper, 12 for things you press, full round for chips. Three values only.
- Surface steps (CF-2): two. Ground, then slip. No third tier, no cards inside slips.
- Shadow philosophy (CF-5): soft-elevation, kept faint. Android `elevation: 2`; elsewhere ink at 0.10,
  radius 8, offset 0 2.
- Glass (CF-3): not used.
- Pressed state: opacity 0.86. Disabled: opacity 0.4.
- Focus: native platform focus; no custom focus ring.

## Primitives

- Button (`kit.tsx` Button): primary = accent fill, white 500 text, 56 px tall, radius 12; secondary = slip
  fill with rule border; link = accent text only.
- Input: body size, ink1, 1 px rule border, radius 12, 12 px padding, slip fill.
- Slip (card): white, radius 4, faint elevation, zigzag bottom edge.
- Banner: tone info / warn / danger, soft fill with the matching ink.
- Line: label left in ink2, value right in ink1, rule between rows.

## Motion

- Curve: cubic-bezier(0.2, 0.8, 0.2, 1), one curve for everything.
- Receipt print: 700 ms, the slip slides down 24 px and fades in.
- Check dot (the "Checked hh:mm:ss" pulse): 400 ms fade.
- Press: instant opacity change. A 160 ms press token is declared in theme.ts but not used.
- Paid: a success haptic, and a two-note chime (app/assets/sounds/paid.wav) for Paid and Overpaid.
- Reduced motion: when the system asks for it, the print runs at 0 ms.
- No looping animation.

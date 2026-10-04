# Kobo icon

The signature element is the till slip coming out of a printer slot: a white receipt with a zigzag
torn edge under a dark ink bar, on the accent green. It encodes what Kobo does: it watches Solana for
the payment, then prints the proof. The same slip shape carries every money screen in the app.

Route: vector. Every PNG here was rendered natively by Chrome from the SVG next to it at the stated
size. Nothing is upscaled.

| File | Size | Use |
|---|---|---|
| icon.png / icon.svg | 1024 | app icon (app.json `icon`), store listing |
| android-icon-foreground.png | 1024 | adaptive icon foreground; art scaled to 0.72 so it stays inside the centre-66% safe zone |
| android-icon-background.png | 1024 | adaptive icon background, solid #00774A |
| android-icon-monochrome.png | 1024 | Android themed icon, white silhouette on transparent |
| splash-icon.png | 1024 | splash, shown at 200 px on the ground #ECEEEB |
| favicon.png / favicon.svg | 48 | web export |
| icon-512 / icon-48 / icon-24.png | proofs at the sizes a judge sees | |
| proof-sheet.png | 128, 48 circle, 48 rounded, 24, on the ground and on dark | the look-at-it check |

Caveats: the proof sheet's "adaptive in a circle mask" cell is drawn by a quick HTML sheet and is
squashed there; the geometry was checked by numbers (slip corners 315 px from centre, safe radius
338 px). The real check is the launcher on the phone after the next build. Candidates and the verdicts
are in brand/explorations and brand/CRITIQUE.md; the pick was made unattended and is flagged for the
owner.

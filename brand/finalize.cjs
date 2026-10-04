// Stage 5: export the chosen candidate (c3, slip printing) at deliverable spec, every size rendered
// natively by Chrome from SVG. Writes brand/final/* and copies the Android set into app/assets/images.
const fs = require('fs')
const path = require('path')
const PP = process.env.PP || 'puppeteer'
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const G = '#00774A', SLIP = '#FFFFFF', INK = '#151714', GROUND = '#ECEEEB'
const FINAL = path.join(__dirname, 'final')
const APP = path.join(__dirname, '..', 'app', 'assets', 'images')
fs.mkdirSync(FINAL, { recursive: true })

function slipPath({ x = 232, w = 560, top = 300, bottom = 812, teeth = 8, depth = 36, r = 0 } = {}) {
  const step = w / teeth
  let d = `M${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bottom}`
  for (let i = teeth; i > 0; i--) {
    const xr = x + i * step, xm = xr - step / 2, xl = xr - step
    d += ` L${xm},${bottom + depth} L${xl},${bottom}`
  }
  d += ` V${top + r} Q${x},${top} ${x + r},${top} Z`
  return d
}
// Refined spacing from the critique: bar and slip read as one object (slip top tucked 12 px under the bar).
const BAR = { x: 176, y: 220, w: 672, h: 92 }
const d = slipPath({ top: BAR.y + BAR.h - 12, bottom: 800 })
const art = (slipFill, barFill, withShadow) =>
  `<rect x="${BAR.x}" y="${BAR.y}" width="${BAR.w}" height="${BAR.h}" rx="14" fill="${barFill}"/>` +
  (withShadow ? `<path d="${d}" fill="rgba(0,0,0,0.18)" transform="translate(0,10)"/>` : '') +
  `<path d="${d}" fill="${slipFill}"/>`
const svg = (inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${inner}</svg>`
// Adaptive foreground: the launcher shows the centre 66%, so the art is scaled to 0.72 about the centre.
const safe = (inner) => `<g transform="translate(512,512) scale(0.72) translate(-512,-512)">${inner}</g>`

const files = {
  'icon.svg': svg(art(SLIP, INK, true), G),
  'android-icon-foreground.svg': svg(safe(art(SLIP, INK, true)), null),
  'android-icon-background.svg': svg('', G),
  'android-icon-monochrome.svg': svg(safe(art(SLIP, SLIP, false)), null),
  'splash-icon.svg': svg(art(SLIP, INK, true), null), // shown at 200 px on the ground colour
  'favicon.svg': svg(art(SLIP, INK, false), G),
}
for (const [k, v] of Object.entries(files)) fs.writeFileSync(path.join(FINAL, k), v)

const renders = [
  ['icon.svg', 'icon.png', 1024], ['android-icon-foreground.svg', 'android-icon-foreground.png', 1024],
  ['android-icon-background.svg', 'android-icon-background.png', 1024], ['android-icon-monochrome.svg', 'android-icon-monochrome.png', 1024],
  ['splash-icon.svg', 'splash-icon.png', 1024], ['favicon.svg', 'favicon.png', 48],
  ['icon.svg', 'icon-512.png', 512], ['icon.svg', 'icon-48.png', 48], ['icon.svg', 'icon-24.png', 24],
]
;(async () => {
  const puppeteer = require(PP)
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true })
  const p = await b.newPage()
  for (const [src, out, size] of renders) {
    await p.setViewport({ width: size, height: size, deviceScaleFactor: 1 })
    await p.setContent(`<!doctype html><html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(files[src]).toString('base64')}" width="${size}" height="${size}" style="display:block"></body></html>`)
    await p.screenshot({ path: path.join(FINAL, out), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
  }
  // Proof sheet: the final at 48 under circle/squircle masks and at 24, on the ground and on dark.
  const uri = 'data:image/svg+xml;base64,' + Buffer.from(files['icon.svg']).toString('base64')
  const fg = 'data:image/svg+xml;base64,' + Buffer.from(files['android-icon-foreground.svg']).toString('base64')
  await p.setViewport({ width: 760, height: 200, deviceScaleFactor: 1 })
  await p.setContent(`<body style="margin:0;background:${GROUND};font:14px -apple-system,sans-serif"><div style="display:flex;gap:24px;align-items:center;padding:20px">
    <img src="${uri}" width="128" height="128" style="border-radius:28px"><img src="${uri}" width="48" height="48" style="border-radius:50%"><img src="${uri}" width="48" height="48" style="border-radius:10px"><img src="${uri}" width="24" height="24" style="border-radius:5px">
    <div style="width:96px;height:96px;border-radius:50%;background:${G};overflow:hidden;display:flex"><img src="${fg}" width="157" height="157" style="margin:-30px"></div><span>adaptive: foreground in a circle mask</span>
    <div style="background:#151714;padding:12px;border-radius:8px;display:flex;gap:16px"><img src="${uri}" width="48" height="48" style="border-radius:50%"><img src="${uri}" width="24" height="24" style="border-radius:5px"></div></div></body>`)
  await p.screenshot({ path: path.join(FINAL, 'proof-sheet.png') })
  await b.close()
  for (const f of ['icon.png', 'android-icon-foreground.png', 'android-icon-background.png', 'android-icon-monochrome.png', 'splash-icon.png', 'favicon.png']) fs.copyFileSync(path.join(FINAL, f), path.join(APP, f))
  console.log('wrote brand/final and copied 6 files into app/assets/images')
})().catch((e) => { console.error(e); process.exit(1) })

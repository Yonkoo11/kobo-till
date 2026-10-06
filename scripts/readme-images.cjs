// Builds the README pictures in assets/readme/ from full-size frames of the real recordings.
// Every phone screen gets the same treatment: the full screen, rounded corners, one soft
// shadow, the same scale, on the app's ground colour. Run: node scripts/readme-images.cjs
// Frames: recordings/frames/*.png (1080x2400, gitignored), cut from the 2026-10-05 mainnet recordings with
// ffmpeg; recordings/frames/paypage.png is the whole pay page captured at 360 px wide, 3x.
const fs = require('fs')
const path = require('path')
const puppeteer = require(process.env.PP || 'puppeteer')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const ROOT = path.join(__dirname, '..')
const FRAMES = path.join(ROOT, 'recordings', 'frames')
const OUT = path.join(ROOT, 'assets', 'readme')
const FONTS = path.join(ROOT, 'video', 'public', 'fonts')
const W = 300 // CSS width of one phone screen; rendered at 2x
const CROP = 0 // full screen, gesture bar included: the pictures show the build as recorded

const font = (w, f) => `@font-face{font-family:F;font-weight:${w};src:url("file://${path.join(FONTS, f)}")}`
const css = `
${font(400, 'FamiljenGrotesk_400Regular.ttf')}${font(500, 'FamiljenGrotesk_500Medium.ttf')}${font(600, 'FamiljenGrotesk_600SemiBold.ttf')}
*{box-sizing:border-box;margin:0}
body{background:#ECEEEB;font-family:F,system-ui,sans-serif;color:#151714}
.card{display:inline-flex;gap:56px;padding:48px 56px 40px;background:#ECEEEB;align-items:flex-start}
.item{display:flex;flex-direction:column;align-items:center;gap:18px;width:${W}px}
.screen{width:${W}px;height:${Math.round(W * (2400 / 1080) * (1 - CROP))}px;border-radius:30px;overflow:hidden;
  box-shadow:0 0 0 1px rgba(21,23,20,.10),0 24px 48px -24px rgba(21,23,20,.45);background:#fff}
.screen img{width:100%;display:block}
.screen.page{height:auto}
.label{font-weight:500;font-size:19px;line-height:26px;text-align:center}
.step{font-weight:600;color:#00774A}
.single{padding:28px 32px}
`
const phone = (file, label, step, cls = '') => `<div class="item"><div class="screen ${cls}"><img src="file://${path.join(FRAMES, file)}"></div>${
  label ? `<div class="label">${step ? `<span class="step">${step}</span> ` : ''}${label}</div>` : ''}</div>`

const pictures = {
  hero: `<div class="card">${phone('till.png', 'Type the price in naira', '1')}${phone('waiting.png', 'Show one QR', '2')}${phone('paid.png', 'See Paid', '3')}</div>`,
  'till': `<div class="card single">${phone('till.png')}</div>`,
  'waiting': `<div class="card single">${phone('waiting.png')}</div>`,
  'phantom': `<div class="card single">${phone('phantom-sol.png')}</div>`,
  'paid': `<div class="card single">${phone('paid.png')}</div>`,
  'today': `<div class="card single">${phone('today.png')}</div>`,
  'paypage': `<div class="card single">${phone('paypage.png', '', '', 'page')}</div>`, // whole web page, not a phone-height crop
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 })
  for (const [name, html] of Object.entries(pictures)) {
    const need = (html.match(/frames\/([a-z-]+\.png)/g) || []).map((m) => m.slice(7))
    const missing = need.filter((f) => !fs.existsSync(path.join(FRAMES, f)))
    if (missing.length) { console.log(`skip ${name}: missing ${missing.join(', ')}`); continue }
    const tmp = path.join(OUT, '_render.html') // a file page may load file:// images; a setContent page may not
    fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><style>${css}</style>${html}`)
    await page.goto(`file://${tmp}`, { waitUntil: 'load' })
    fs.unlinkSync(tmp)
    await page.evaluate(() => document.fonts.ready)
    const el = await page.$('.card')
    await el.screenshot({ path: path.join(OUT, `${name}.png`) })
    console.log(`wrote assets/readme/${name}.png`)
  }
  await browser.close()
})()

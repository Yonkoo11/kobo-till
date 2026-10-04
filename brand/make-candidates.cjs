// Vector route. Writes four SVG candidates to brand/explorations and a contact sheet PNG
// showing each at 1024 (scaled), 48 and 24 px, plus the Android circle mask at 48 px.
const fs = require('fs')
const path = require('path')
const PP = process.env.PP || 'puppeteer'
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const G = '#00774A', SLIP = '#FFFFFF', INK = '#151714'
const EX = path.join(__dirname, 'explorations')
fs.mkdirSync(EX, { recursive: true })

// The slip: x 232..792 (560 wide), top 176, body to 812, teeth 36 deep, 8 teeth across.
function slipPath({ x = 232, w = 560, top = 176, bottom = 812, teeth = 8, depth = 36, r = 14 } = {}) {
  const step = w / teeth
  let d = `M${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bottom}`
  for (let i = teeth; i > 0; i--) {
    const xr = x + i * step, xm = xr - step / 2, xl = xr - step
    d += ` L${xm},${bottom + depth} L${xl},${bottom}`
  }
  d += ` V${top + r} Q${x},${top} ${x + r},${top} Z`
  return d
}
const shadow = (d) => `<path d="${d}" fill="rgba(0,0,0,0.18)" transform="translate(0,10)"/>`
const tick = (cx, cy, s, c = G) => `<path d="M${cx - s * 0.42},${cy} L${cx - s * 0.12},${cy + s * 0.3} L${cx + s * 0.46},${cy - s * 0.3}" fill="none" stroke="${c}" stroke-width="${s * 0.16}" stroke-linecap="square" stroke-linejoin="miter"/>`
const wrap = (inner, bg = G) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><rect width="1024" height="1024" fill="${bg}"/>${inner}</svg>`

const d = slipPath()
const candidates = {
  'c1-slip': wrap(`${shadow(d)}<path d="${d}" fill="${SLIP}"/>`),
  'c2-slip-paid': wrap(`${shadow(d)}<path d="${d}" fill="${SLIP}"/>${tick(512, 470, 300)}`),
  'c3-slip-printing': wrap(`<rect x="176" y="236" width="672" height="92" rx="14" fill="${INK}"/>${shadow(slipPath({ top: 300, bottom: 812 }))}<path d="${slipPath({ top: 300, bottom: 812, r: 0 })}" fill="${SLIP}"/>`),
  'c4-slip-rows': wrap(`${shadow(d)}<path d="${d}" fill="${SLIP}"/><rect x="312" y="296" width="200" height="40" rx="8" fill="${INK}"/><rect x="312" y="400" width="400" height="40" rx="8" fill="${INK}"/><rect x="312" y="504" width="280" height="40" rx="8" fill="${INK}"/><rect x="312" y="608" width="400" height="40" rx="8" fill="${G}"/>`),
}
for (const [k, svg] of Object.entries(candidates)) fs.writeFileSync(path.join(EX, `${k}.svg`), svg)

const html = `<!doctype html><html><body style="margin:0;background:#ECEEEB;font:16px -apple-system,sans-serif;color:#151714">
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;padding:24px;width:1400px">
${Object.entries(candidates).map(([k, svg]) => {
  const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  return `<div><div style="font-weight:600;margin-bottom:8px">${k}</div>
  <img src="${uri}" width="300" height="300" style="border-radius:66px;display:block">
  <div style="display:flex;gap:20px;align-items:center;margin-top:16px;padding:16px;background:#fff;border-radius:8px">
    <img src="${uri}" width="48" height="48" style="border-radius:50%"><img src="${uri}" width="48" height="48" style="border-radius:10px"><img src="${uri}" width="24" height="24" style="border-radius:5px"><span style="color:#666">48 circle · 48 rounded · 24</span></div>
  <div style="display:flex;gap:20px;align-items:center;margin-top:8px;padding:16px;background:#151714;border-radius:8px">
    <img src="${uri}" width="48" height="48" style="border-radius:50%"><img src="${uri}" width="24" height="24" style="border-radius:5px"><span style="color:#aaa">on dark</span></div></div>`
}).join('')}</div></body></html>`
fs.writeFileSync(path.join(EX, 'contact-sheet.html'), html)
;(async () => {
  const puppeteer = require(PP)
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true })
  const p = await b.newPage()
  await p.setViewport({ width: 1400, height: 560, deviceScaleFactor: 1 })
  await p.goto('file://' + path.join(EX, 'contact-sheet.html'))
  await p.screenshot({ path: path.join(EX, 'contact-sheet.png'), fullPage: true })
  await b.close()
  console.log('wrote', Object.keys(candidates).length, 'candidates + contact-sheet.png')
})()

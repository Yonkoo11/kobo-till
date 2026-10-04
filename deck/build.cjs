// Renders the deck as one HTML file in Kobo's own look, then prints it to PDF and one PNG per slide
// with the app's typeface loaded from video/public/fonts. Run: node build.cjs (needs puppeteer; see PP).
const fs = require('fs')
const path = require('path')
const { T, slides } = require('./content.cjs')

const PP = process.env.PP || 'puppeteer'
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const img = (src, cls = '') => `<img class="phone ${cls}" src="../${src}" alt="">`
const slip = (inner, cls = '') => `<div class="slip ${cls}">${inner}<div class="tear"></div></div>`

function render(s) {
  switch (s.kind) {
    case 'cover':
      return `<section class="slide cover"><div class="col">
        <div class="kicker">${esc(s.kicker)}</div>
        <h1 class="brand">${esc(s.title)}</h1>
        <h2 class="headline">${esc(s.headline)}</h2>
        <p class="sub">${esc(s.sub)}</p></div>
        <div class="phones">${img(s.image)}</div></section>`
    case 'lines':
      return `<section class="slide lines"><div class="kicker">${esc(s.kicker)}</div>
        ${s.lines.map((l) => `<p class="line ${l.muted ? 'muted' : ''}">${esc(l.text)}</p>`).join('')}
        <p class="note">${esc(s.note)}</p></section>`
    case 'steps':
      return `<section class="slide steps"><div class="col">
        <div class="kicker">${esc(s.kicker)}</div><h2 class="title">${esc(s.title)}</h2>
        <ol class="steplist">${s.steps.map((st) => `<li><span class="n">${st.n}</span><div><b>${esc(st.head)}</b><p>${esc(st.body)}</p></div></li>`).join('')}</ol></div>
        <div class="phones two">${s.images.map((i) => img(i)).join('')}</div></section>`
    case 'feature':
      return `<section class="slide feature"><div class="col">
        <div class="kicker">${esc(s.kicker)}</div><h2 class="title">${esc(s.title)}</h2>
        <ul class="bullets">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
        <div class="phones ${s.images.length > 1 ? 'two' : ''}">${s.images.map((i) => img(i)).join('')}</div></section>`
    case 'table':
      return `<section class="slide table"><div class="kicker">${esc(s.kicker)}</div><h2 class="title">${esc(s.title)}</h2>
        ${slip(`<table>${s.rows.map(([a, b]) => `<tr><td class="cap">${esc(a)}</td><td class="${/^Not/.test(b) ? 'no' : 'yes'}">${esc(b)}</td></tr>`).join('')}</table>`, 'wide')}</section>`
    case 'dates':
      return `<section class="slide dates"><div class="kicker">${esc(s.kicker)}</div><h2 class="title">${esc(s.title)}</h2>
        ${slip(`<table>${s.dates.map(([d, w]) => `<tr><td class="date">${d}</td><td>${esc(w)}</td></tr>`).join('')}</table>`, 'wide')}
        <p class="note">${esc(s.kill)}</p></section>`
    case 'close':
      return `<section class="slide cover close"><div class="col">
        <h1 class="brand">${esc(s.title)}</h1><h2 class="headline">${esc(s.headline)}</h2>
        ${s.lines.map((l) => `<p class="sub">${esc(l)}</p>`).join('')}</div>
        <div class="phones">${img(s.image)}</div></section>`
  }
}

const css = `
@font-face{font-family:'Familjen Grotesk';font-weight:400;src:url('../../video/public/fonts/FamiljenGrotesk_400Regular.ttf')}
@font-face{font-family:'Familjen Grotesk';font-weight:500;src:url('../../video/public/fonts/FamiljenGrotesk_500Medium.ttf')}
@font-face{font-family:'Familjen Grotesk';font-weight:600;src:url('../../video/public/fonts/FamiljenGrotesk_600SemiBold.ttf')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${T.ground};color:${T.ink};font-family:'Familjen Grotesk',sans-serif;font-weight:400}
.slide{width:1920px;height:1080px;padding:96px 120px;position:relative;overflow:hidden;background:${T.ground};page-break-after:always;display:flex;flex-direction:column}
.cover,.steps,.feature{flex-direction:row;align-items:center;gap:80px}
.col{flex:1;min-width:0}
.kicker{font-size:28px;font-weight:500;color:${T.accent};letter-spacing:0.01em;margin-bottom:28px}
.brand{font-size:200px;font-weight:500;line-height:0.9;letter-spacing:-0.03em}
.headline{font-size:76px;font-weight:500;line-height:1.05;letter-spacing:-0.02em;margin-top:24px}
.sub{font-size:34px;line-height:1.35;color:${T.muted};margin-top:28px;max-width:900px}
.title{font-size:64px;font-weight:500;line-height:1.08;letter-spacing:-0.02em;max-width:1500px}
.steps .title,.feature .title{max-width:1000px}
.line{font-size:88px;font-weight:500;line-height:1.08;letter-spacing:-0.02em;max-width:1500px;margin-top:18px}
.line.muted{color:${T.muted};font-size:56px;font-weight:400;margin-top:0;margin-bottom:12px}
.note{font-size:30px;line-height:1.4;color:${T.muted};margin-top:auto;max-width:1300px}
.phones{display:flex;gap:40px;align-items:center;flex:0 0 auto}
.phone{height:880px;border-radius:30px;box-shadow:0 2px 0 rgba(21,23,20,0.08),0 24px 48px -24px rgba(21,23,20,0.35)}
.phones.two .phone{height:760px}
.steplist{list-style:none;margin-top:40px;display:grid;gap:26px}
.steplist li{display:flex;gap:22px;font-size:28px;line-height:1.35}
.steplist .n{flex:0 0 52px;height:52px;border-radius:999px;background:${T.accent};color:#fff;font-weight:500;display:flex;align-items:center;justify-content:center;font-size:26px}
.steplist b{font-weight:500;display:block;font-size:32px;margin-bottom:4px}
.steplist p{color:${T.muted};max-width:760px}
.bullets{list-style:none;margin-top:44px;display:grid;gap:30px;max-width:900px}
.bullets li{font-size:32px;line-height:1.4;padding-left:36px;position:relative}
.bullets li::before{content:'';position:absolute;left:0;top:18px;width:14px;height:14px;background:${T.accent};border-radius:999px}
.slip{background:${T.slip};border-radius:4px 4px 0 0;padding:20px 48px 24px;position:relative;margin-top:36px;box-shadow:0 1px 0 rgba(21,23,20,0.06)}
.slip.wide{width:100%}
.tear{position:absolute;left:0;right:0;bottom:-14px;height:14px;background:linear-gradient(135deg,${T.slip} 50%,transparent 50%) 0 0/28px 14px,linear-gradient(-135deg,${T.slip} 50%,transparent 50%) 14px 0/28px 14px}
table{width:100%;border-collapse:collapse}
td{padding:16px 0;border-bottom:1px solid ${T.rule};font-size:26px;line-height:1.3;vertical-align:top}
tr:last-child td{border-bottom:0}
td.cap{width:34%;font-weight:500;padding-right:48px}
td.yes{color:${T.ink}}
td.no{color:${T.muted}}
td.date{width:220px;font-weight:500;color:${T.accent}}
.dates td{font-size:34px;padding:26px 0}
.close .sub{color:${T.ink};font-weight:500}
@page{size:1920px 1080px;margin:0}
`
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kobo pitch deck</title><style>${css}</style></head><body>${slides.map(render).join('\n')}</body></html>`
fs.writeFileSync(path.join(OUT, 'pitch-deck.html'), html)

;(async () => {
  const puppeteer = require(PP)
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  await page.goto('file://' + path.join(OUT, 'pitch-deck.html'), { waitUntil: 'networkidle0' })
  await page.evaluateHandle('document.fonts.ready')
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length)
  for (let i = 0; i < slides.length; i++) {
    await page.evaluate((i) => window.scrollTo(0, i * 1080), i)
    await page.screenshot({ path: path.join(OUT, `slide-${String(i + 1).padStart(2, '0')}.png`), clip: { x: 0, y: i * 1080, width: 1920, height: 1080 } })
  }
  await page.pdf({ path: path.join(OUT, 'pitch-deck.pdf'), width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true })
  await browser.close()
  console.log(`slides ${slides.length}, fonts loaded ${fonts}, wrote out/pitch-deck.pdf and PNGs`)
})().catch((e) => { console.error(e); process.exit(1) })

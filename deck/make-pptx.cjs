// Same slides as build.cjs, as a .pptx for forms that want one. Fonts are named, not embedded, so a
// machine without Familjen Grotesk substitutes; the PDF from build.cjs is the reference render.
const path = require('path')
const pptxgen = require('pptxgenjs')
const { T, slides } = require('./content.cjs')

const hex = (c) => c.replace('#', '')
const FONT = 'Familjen Grotesk'
const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9' // 10 x 5.625 in
pres.title = 'Kobo pitch deck'
const W = 10, H = 5.625, M = 0.62
const base = { fontFace: FONT, color: hex(T.ink) }
const kicker = (s, text) => s.addText(text, { ...base, x: M, y: 0.5, w: 6, h: 0.35, fontSize: 14, bold: true, color: hex(T.accent) })
const phone = (s, src, x, y, h) => s.addImage({ path: path.join(__dirname, src), x, y, h, w: h * 0.45, rounding: false })
const muted = '7A7C79'

for (const sl of slides) {
  const s = pres.addSlide()
  s.background = { color: hex(T.ground) }
  switch (sl.kind) {
    case 'cover':
    case 'close': {
      if (sl.kicker) kicker(s, sl.kicker)
      s.addText(sl.title, { ...base, x: M, y: 1.2, w: 6, h: 1.4, fontSize: 96, bold: true })
      s.addText(sl.headline, { ...base, x: M, y: 2.6, w: 6.4, h: 0.8, fontSize: 36, bold: true })
      const subs = sl.sub ? [sl.sub] : sl.lines
      subs.forEach((t, i) => s.addText(t, { ...base, x: M, y: 3.45 + i * 0.5, w: 6.2, h: 0.8, fontSize: 16, color: sl.sub ? muted : hex(T.ink) }))
      phone(s, sl.image, 7.3, 0.45, 4.7)
      break
    }
    case 'lines': {
      kicker(s, sl.kicker)
      let y = 1.0
      for (const l of sl.lines) {
        s.addText(l.text, { ...base, x: M, y, w: 8.6, h: l.muted ? 0.6 : 0.95, fontSize: l.muted ? 26 : 42, bold: !l.muted, color: l.muted ? muted : hex(T.ink) })
        y += l.muted ? 0.65 : 1.0
      }
      s.addText(sl.note, { ...base, x: M, y: H - 1.1, w: 8, h: 0.6, fontSize: 15, color: muted })
      break
    }
    case 'steps': {
      kicker(s, sl.kicker)
      s.addText(sl.title, { ...base, x: M, y: 0.9, w: 5.4, h: 0.9, fontSize: 28, bold: true })
      sl.steps.forEach((st, i) => {
        const y = 1.95 + i * 0.85
        s.addShape(pres.ShapeType.ellipse, { x: M, y: y + 0.03, w: 0.3, h: 0.3, fill: { color: hex(T.accent) } })
        s.addText(st.n, { ...base, x: M, y: y + 0.03, w: 0.3, h: 0.3, fontSize: 11, color: 'FFFFFF', align: 'center', valign: 'middle' })
        s.addText([{ text: st.head, options: { bold: true, fontSize: 14, breakLine: true } }, { text: st.body, options: { fontSize: 11, color: muted } }], { ...base, x: M + 0.42, y, w: 4.9, h: 0.8, valign: 'top' })
      })
      sl.images.forEach((im, i) => phone(s, im, 6.3 + i * 1.85, 0.55, 3.9))
      break
    }
    case 'feature': {
      kicker(s, sl.kicker)
      s.addText(sl.title, { ...base, x: M, y: 0.9, w: 5.4, h: 0.9, fontSize: 28, bold: true })
      s.addText(sl.bullets.map((b) => ({ text: b, options: { bullet: { indent: 14 }, breakLine: true, paraSpaceAfter: 10 } })), { ...base, x: M, y: 1.95, w: 5.3, h: 3.2, fontSize: 14, valign: 'top' })
      const two = sl.images.length > 1
      sl.images.forEach((im, i) => phone(s, im, two ? 6.3 + i * 1.85 : 7.3, 0.55, two ? 3.9 : 4.6))
      break
    }
    case 'table':
    case 'dates': {
      kicker(s, sl.kicker)
      s.addText(sl.title, { ...base, x: M, y: 0.9, w: 8.6, h: 0.6, fontSize: 28, bold: true })
      const rows = (sl.rows || sl.dates).map(([a, b]) => [
        { text: a, options: { bold: true, color: sl.dates ? hex(T.accent) : hex(T.ink) } },
        { text: b, options: { color: /^Not/.test(b) ? muted : hex(T.ink) } },
      ])
      s.addTable(rows, { x: M, y: 1.6, w: W - 2 * M, colW: sl.dates ? [1.4, 7.36] : [3.0, 5.76], fontFace: FONT, fontSize: sl.dates ? 14 : 12, fill: { color: hex(T.slip) }, border: { type: 'solid', pt: 0.5, color: 'E3E5E2' }, margin: 0.08, valign: 'top' })
      if (sl.kill) s.addText(sl.kill, { ...base, x: M, y: H - 0.85, w: 8.6, h: 0.5, fontSize: 13, color: muted })
      break
    }
  }
}

pres.writeFile({ fileName: path.join(__dirname, 'out', 'pitch-deck.pptx') }).then((f) => console.log('wrote', f))

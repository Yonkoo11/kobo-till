// Fills the pay page from the link's # fragment. Every value is written as text, never as HTML.
import { parsePayLink } from './link.js'
import { qrSvg } from './qr.js'

const $ = (id) => document.getElementById(id)
const WHY = {
  recipient: 'The shop address in it is not a Solana address.',
  amount: 'The amount in it is not a valid amount.',
  coin: 'It asks for a coin Kobo does not take, or it came from a test version of Kobo.',
  reference: 'It is missing the sale reference.',
  naira: 'The naira price in it is not a valid number.',
}

async function show() {
  const got = parsePayLink(location.hash)
  if (!got.ok) {
    $('badWhy').textContent = `${WHY[got.reason] || ''} Ask the shop to send a new one.`
    $('bad').hidden = false
    $('ok').hidden = true
    return
  }
  $('shop').textContent = got.label ? `Payment request from "${got.label}"` : 'Payment request'
  $('amount').textContent = `${got.amount} ${got.coin}`
  $('naira').textContent = got.naira ? `₦${Number(got.naira).toLocaleString('en-NG')}, as written in the link` : ''
  $('pay').href = got.solanaUrl
  $('coinNote').textContent = `Pay in ${got.coin}, exactly ${got.amount}. If your wallet asks which coin to pay with, pick ${got.coin}.`
  $('to').textContent = got.recipient
  // The QR library's SVG is parsed as an image document and attached as a node; no markup is inserted.
  const svg = new DOMParser().parseFromString(await qrSvg(got.solanaUrl), 'image/svg+xml').documentElement
  $('qr').replaceChildren(document.importNode(svg, true))
  $('ok').hidden = false
  $('bad').hidden = true
  document.title = `Pay ${got.amount} ${got.coin} with Kobo`
}

show()
window.addEventListener('hashchange', show)

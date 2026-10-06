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
  $('coinNote').textContent = `Pay in ${got.coin}, exactly ${got.amount}. If your wallet shows SOL or another coin, switch it to ${got.coin} and keep the amount at ${got.amount}.`
  $('to').textContent = got.recipient
  $('qr').innerHTML = await qrSvg(got.solanaUrl) // SVG made by the QR library from the checked link
  $('ok').hidden = false
  $('bad').hidden = true
  document.title = `Pay ${got.amount} ${got.coin} with Kobo`
}

show()
window.addEventListener('hashchange', show)

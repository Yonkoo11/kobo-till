// Reads a Kobo payment link's # fragment and rebuilds the Solana Pay link the wallet opens.
// Shared by the pay page (docs/pay/page.js) and the app's tests (app/core/share.test.ts).
// The fragment never reaches the server, so nothing about the sale is logged by the host.

// Only the real coins. A test build's coin, or any other mint, is refused rather than shown as "USDC".
export const MINTS = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const AMOUNT = /^(0|[1-9]\d{0,9})(\.\d{1,6})?$/
const NAIRA = /^[1-9]\d{0,11}$/

/**
 * @param {string} hash location.hash, with or without the leading '#'
 * @returns {{ ok: true, recipient: string, amount: string, mint: string, coin: string, reference: string,
 *   label: string, naira: string, solanaUrl: string } | { ok: false, reason: string }}
 */
export function parsePayLink(hash) {
  const p = new URLSearchParams(String(hash || '').replace(/^#/, ''))
  const recipient = p.get('r') || ''
  const amount = p.get('a') || ''
  const mint = p.get('m') || ''
  const reference = p.get('ref') || ''
  const naira = p.get('n') || ''
  const label = (p.get('l') || '').slice(0, 64)
  if (!BASE58.test(recipient)) return { ok: false, reason: 'recipient' }
  if (!AMOUNT.test(amount) || Number(amount) <= 0) return { ok: false, reason: 'amount' }
  if (!Object.prototype.hasOwnProperty.call(MINTS, mint)) return { ok: false, reason: 'coin' }
  if (!BASE58.test(reference)) return { ok: false, reason: 'reference' }
  if (naira && !NAIRA.test(naira)) return { ok: false, reason: 'naira' }
  const q = new URLSearchParams({ amount, 'spl-token': mint, reference, label: label || 'Kobo shop', message: 'Kobo sale' })
  const solanaUrl = `solana:${recipient}?${q.toString().replace(/\+/g, '%20')}`
  return { ok: true, recipient, amount, mint, coin: MINTS[mint], reference, label, naira, solanaUrl }
}

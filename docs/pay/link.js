// Reads a Kobo payment link's # fragment and rebuilds the Solana Pay link the wallet opens.
// Shared by the pay page (docs/pay/page.js) and the app's tests (app/core/share.test.ts).
// The fragment never reaches the server, so nothing about the sale is logged by the host.

// Only the real coins. A test build's coin, or any other mint, is refused rather than shown as "USDC".
export const MINTS = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
}

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

/** True when s is base58 for exactly 32 bytes, the size of a Solana address. */
export function isAddress32(s) {
  if (!BASE58.test(s)) return false
  let n = 0n
  for (const c of s) n = n * 58n + BigInt(ALPHABET.indexOf(c))
  let bytes = 0
  while (n > 0n) { n >>= 8n; bytes++ }
  for (const c of s) { if (c !== '1') break; bytes++ } // leading '1's are zero bytes
  return bytes === 32
}

// Shop names are capped at 40 characters in the app. Control, format (bidi, zero-width) and line characters are
// dropped so a name cannot reverse itself or fake a badge.
export function cleanLabel(raw) {
  return Array.from(String(raw || '').replace(/[\p{Cc}\p{Cf}\u2028\u2029]/gu, '').trim()).slice(0, 40).join('')
}
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
  const label = cleanLabel(p.get('l'))
  if (!isAddress32(recipient)) return { ok: false, reason: 'recipient' }
  if (!AMOUNT.test(amount) || Number(amount) <= 0) return { ok: false, reason: 'amount' }
  if (!Object.prototype.hasOwnProperty.call(MINTS, mint)) return { ok: false, reason: 'coin' }
  if (!isAddress32(reference)) return { ok: false, reason: 'reference' }
  if (naira && !NAIRA.test(naira)) return { ok: false, reason: 'naira' }
  const q = new URLSearchParams({ amount, 'spl-token': mint, reference, label, message: 'Kobo sale' })
  const solanaUrl = `solana:${recipient}?${q.toString().replace(/\+/g, '%20')}`
  return { ok: true, recipient, amount, mint, coin: MINTS[mint], reference, label, naira, solanaUrl }
}

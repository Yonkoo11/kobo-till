import { COINS } from './constants'
import { formatCoins, Sale } from './sale'

// The pay page lives on the project's GitHub Pages site (docs/pay/), the same site the wallet identity names.
export const PAY_PAGE = 'https://yonkoo11.github.io/kobo-till/pay/'
/** How long a shared link may be paid from the pay page. The till still records a payment that lands later. */
export const LINK_LIFETIME_MS = 60 * 60 * 1000

/**
 * A web link for sending a sale to a customer who is not at the counter (WhatsApp makes https tappable, not
 * solana:). Everything rides in the # fragment, which the browser never sends to the server.
 */
export function shareLink(sale: Pick<Sale, 'recipient' | 'expected' | 'coin' | 'reference' | 'label' | 'naira'>, expiresAt?: number): string {
  const p = new URLSearchParams({
    r: sale.recipient,
    a: formatCoins(sale.expected, COINS[sale.coin].decimals),
    m: COINS[sale.coin].mint,
    ref: sale.reference,
    n: String(Math.round(sale.naira)),
    l: encodeLabel(Array.from(sale.label).slice(0, 40).join('')),
  })
  if (expiresAt) p.set('x', String(Math.floor(expiresAt / 1000)))
  return `${PAY_PAGE}#${p.toString()}`
}

/** base64url of the UTF-8 name; the pay page's decodeLabel (docs/pay/link.js) reverses it. Tested against it.
 * Plain JS on purpose: no btoa/TextEncoder, so it runs the same on any JavaScript engine. */
export function encodeLabel(label: string): string {
  const bytes: number[] = []
  for (const ch of encodeURIComponent(label).match(/%[0-9A-F]{2}|[^%]/g) ?? []) {
    bytes.push(ch.startsWith('%') ? parseInt(ch.slice(1), 16) : ch.charCodeAt(0))
  }
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    out += A[(n >> 18) & 63] + A[(n >> 12) & 63]
    if (i + 1 < bytes.length) out += A[(n >> 6) & 63]
    if (i + 2 < bytes.length) out += A[n & 63]
  }
  return out
}

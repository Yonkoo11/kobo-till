import { COINS } from './constants'
import { formatCoins, Sale } from './sale'

// The pay page lives on the project's GitHub Pages site (docs/pay/), the same site the wallet identity names.
export const PAY_PAGE = 'https://yonkoo11.github.io/kobo-till/pay/'

/**
 * A web link for sending a sale to a customer who is not at the counter (WhatsApp makes https tappable, not
 * solana:). Everything rides in the # fragment, which the browser never sends to the server.
 */
export function shareLink(sale: Pick<Sale, 'recipient' | 'expected' | 'coin' | 'reference' | 'label' | 'naira'>): string {
  const p = new URLSearchParams({
    r: sale.recipient,
    a: formatCoins(sale.expected, COINS[sale.coin].decimals),
    m: COINS[sale.coin].mint,
    ref: sale.reference,
    n: String(Math.round(sale.naira)),
    l: Array.from(sale.label).slice(0, 40).join(''),
  })
  return `${PAY_PAGE}#${p.toString().replace(/\+/g, '%20')}`
}

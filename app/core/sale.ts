import { Address, getAddressDecoder } from '@solana/kit'
import { COINS, CoinId } from './constants'

export interface Sale {
  id: string
  naira: number
  rate: number
  coin: CoinId
  recipient: Address
  reference: Address
  expected: bigint // base units
  label: string
  createdAt: number
}

/** Coins owed for a naira price, rounded UP to 0.01 coin, in base units. */
export function nairaToBaseUnits(naira: number, rate: number, decimals: number): bigint {
  if (!(naira > 0) || !(rate > 0)) throw new Error('naira and rate must be positive')
  const cents = Math.ceil(Math.round((naira / rate) * 1e6) / 1e4) // hundredths of a coin
  return BigInt(cents) * 10n ** BigInt(decimals - 2)
}

export function formatCoins(base: bigint, decimals = 6): string {
  const s = base.toString().padStart(decimals + 1, '0')
  const whole = s.slice(0, -decimals)
  const frac = s.slice(-decimals).replace(/0+$/, '')
  return frac.length ? `${whole}.${frac.padEnd(2, '0')}` : whole
}

export function newReference(random: (b: Uint8Array) => Uint8Array): Address {
  return getAddressDecoder().decode(random(new Uint8Array(32)))
}

export function createSale(args: Omit<Sale, 'id' | 'expected' | 'createdAt'>, now = Date.now()): Sale {
  const expected = nairaToBaseUnits(args.naira, args.rate, COINS[args.coin].decimals)
  return { ...args, expected, id: args.reference, createdAt: now }
}

/** Solana Pay transfer request URL (docs.solanapay.com/spec). */
export function saleUrl(sale: Sale): string {
  const p = new URLSearchParams({
    amount: formatCoins(sale.expected, COINS[sale.coin].decimals),
    'spl-token': COINS[sale.coin].mint,
    reference: sale.reference,
    label: sale.label,
    message: 'Kobo sale',
  })
  return `solana:${sale.recipient}?${p.toString().replace(/\+/g, '%20')}`
}

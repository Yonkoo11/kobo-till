import { address } from '@solana/kit'
import { Sale } from '@/core/sale'
import { StoredSale } from './types'

export function toSale(s: StoredSale): Sale {
  return {
    id: s.id,
    naira: s.naira,
    rate: s.rate,
    coin: s.coin,
    recipient: address(s.recipient),
    reference: address(s.reference),
    expected: BigInt(s.expected),
    label: s.label,
    createdAt: s.createdAt,
  }
}

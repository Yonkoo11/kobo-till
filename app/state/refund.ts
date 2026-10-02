import { saleRewardUsd } from '@/core/rewards'
import { StoredSale } from './types'

/** What a refund returns: everything received, minus a Seeker reward already paid for this sale. */
export function refundAmount(sale: StoredSale, rewardPct: number): { amount: bigint; heldBack: bigint } {
  const received = BigInt(sale.received ?? '0')
  const heldBack = sale.reward === 'sent' ? saleRewardUsd(received, BigInt(sale.expected), rewardPct) : 0n
  return { amount: received - heldBack, heldBack }
}


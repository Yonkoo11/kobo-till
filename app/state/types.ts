import { CoinId } from '@/core/constants'

export interface Shop {
  name: string
  accept: Record<CoinId, boolean>
  rewardPct: number
  adjustPct: number
}

export type SaleState = 'waiting' | 'paid' | 'overpaid' | 'underpaid' | 'refunded' | 'cancelled'
export type RewardState = 'none' | 'pending' | 'sent' | 'skipped' | 'no-skr'

/** A sale as stored: bigints as strings so it survives JSON. */
export interface StoredSale {
  id: string
  naira: number
  rate: number
  coin: CoinId
  recipient: string
  reference: string
  expected: string
  label: string
  createdAt: number
  day: string
  state: SaleState
  matchedBy?: 'reference' | 'amount'
  received?: string
  payer?: string
  signature?: string
  signatures?: string[] // every payment credited to this sale
  paidAt?: number
  sgtMint?: string | null
  reward: RewardState
  rewardSig?: string
  refundSig?: string
  parentId?: string
}

export interface CachedRate {
  value: number
  at: number
  disagree: boolean
}

/** A finished USDC->SKR swap whose transfers are not all sent yet, so a retry never swaps twice. */
export interface SavedSwap {
  sig: string
  minOut: string
  lines: { key: string; day: string; sgtMint: string; payer: string; usd: string; saleIds: string[] }[]
}

export interface KoboData {
  version: 1
  shop: Shop | null
  sales: StoredSale[]
  rewardedByDay: Record<string, string[]> // day -> SGT mints already rewarded
  closedDays: string[]
  rate: CachedRate | null
  manualRate: number | null
  viewOnly: string | null // receiving address typed in view-only mode
  rewardSwap: SavedSwap | null
}

export const EMPTY: KoboData = {
  version: 1,
  shop: null,
  sales: [],
  rewardedByDay: {},
  closedDays: [],
  rate: null,
  manualRate: null,
  viewOnly: null,
  rewardSwap: null,
}

export interface RewardSale {
  id: string
  sgtMint?: string | null
  payer?: string
  received?: bigint // base units of a $1 coin (6 decimals)
  expected: bigint
  status: string
  reward: string
  day: string // YYYY-MM-DD, Africa/Lagos
}

export interface RewardLine {
  key: string // `${day}|${sgtMint}`: the dedupe key
  day: string
  sgtMint: string
  payer: string
  usd: bigint // base units (6 decimals) of reward value
  saleIds: string[]
}

export const rewardKey = (day: string, sgtMint: string) => `${day}|${sgtMint}`

/**
 * One line per Seeker Genesis Token per day, over every sale still waiting for its reward: a second
 * purchase the same day adds to the same line. The reward is a share of the price, never of an
 * overpayment (min of received and expected).
 */
export function rewardLines(sales: RewardSale[], pct: number, alreadyPaid: Set<string>): RewardLine[] {
  const byKey = new Map<string, RewardLine>()
  const bps = BigInt(Math.round(pct * 100)) // 2% -> 200 bps
  for (const s of sales) {
    if (s.reward !== 'pending' || !s.sgtMint || !s.payer || !s.received) continue
    if (!['paid', 'overpaid', 'underpaid'].includes(s.status)) continue
    const key = rewardKey(s.day, s.sgtMint)
    if (alreadyPaid.has(key)) continue
    const base = s.received < s.expected ? s.received : s.expected
    const line = byKey.get(key) ?? { key, day: s.day, sgtMint: s.sgtMint, payer: s.payer, usd: 0n, saleIds: [] }
    line.usd += (base * bps) / 10000n
    line.saleIds.push(s.id)
    byKey.set(key, line)
  }
  return [...byKey.values()].filter((l) => l.usd > 0n)
}

/** Reward value one sale earned, used to hold it back from a later refund. */
export function saleRewardUsd(received: bigint, expected: bigint, pct: number): bigint {
  const base = received < expected ? received : expected
  return (base * BigInt(Math.round(pct * 100))) / 10000n
}

/** Split `skrOut` (base units) across lines in proportion to their USD value, rounding down. */
export function splitSkr(lines: { usd: bigint }[], skrOut: bigint): bigint[] {
  const total = lines.reduce((t, l) => t + l.usd, 0n)
  return total === 0n ? lines.map(() => 0n) : lines.map((l) => (skrOut * l.usd) / total)
}

/** Local calendar day in Lagos (UTC+1, no daylight saving). */
export function lagosDay(ms: number): string {
  return new Date(ms + 3600_000).toISOString().slice(0, 10)
}

export const MAX_TRANSFERS_PER_TX = 10

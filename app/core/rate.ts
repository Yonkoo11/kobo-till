export interface Rate {
  value: number // naira per 1 USD, before merchant adjustment
  at: number // ms epoch when fetched
  sources: number[]
  disagree: boolean // sources differ by more than 2%
}

const SOURCES: { url: string; pick: (j: any) => number }[] = [
  { url: 'https://open.er-api.com/v6/latest/USD', pick: (j) => j.rates.NGN },
  { url: 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn', pick: (j) => j['usd-coin'].ngn },
]

async function fetchOne(src: (typeof SOURCES)[number], timeoutMs: number): Promise<number | null> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const v = src.pick(await (await fetch(src.url, { signal: ctl.signal })).json())
    return typeof v === 'number' && v > 100 && v < 100000 ? v : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/** Average of the sources that answer within 5000ms; null when none do. */
export async function fetchRate(now = Date.now(), timeoutMs = 5000): Promise<Rate | null> {
  const got = (await Promise.all(SOURCES.map((s) => fetchOne(s, timeoutMs)))).filter((v): v is number => v !== null)
  if (got.length === 0) return null
  const value = got.reduce((a, b) => a + b, 0) / got.length
  const disagree = got.length > 1 && (Math.max(...got) - Math.min(...got)) / Math.min(...got) > 0.02
  return { value, at: now, sources: got, disagree }
}

export const RATE_MAX_AGE_MS = 6 * 3600 * 1000

/** Merchant price adjustment: +2 means the customer pays 2% more in dollars (fewer naira per $1). */
export function adjusted(rate: number, adjustPct: number): number {
  return rate / (1 + adjustPct / 100)
}

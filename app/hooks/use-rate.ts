import { useCallback, useEffect, useState } from 'react'
import { adjusted, fetchRate, RATE_MAX_AGE_MS } from '@/core/rate'
import { useStore } from '@/state/store'

export type RateView =
  | { kind: 'loading' }
  | { kind: 'live' | 'offline'; value: number; at: number; disagree: boolean }
  | { kind: 'manual-needed' }
  | { kind: 'manual'; value: number }

/** The rate the till prices with: live, cached (<6h), or typed by the merchant. Adjustment applied. */
export function useRate() {
  const { data, update } = useStore()
  const [loading, setLoading] = useState(true)
  // The clock the labels read. Ticks every 30 s so a rate that goes quiet turns 'offline' without a re-render from elsewhere.
  const [now, setNow] = useState(0)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])
  const refresh = useCallback(async () => {
    setLoading(true)
    const r = await fetchRate()
    if (r) update((d) => ({ ...d, rate: { value: r.value, at: r.at, disagree: r.disagree } }))
    setLoading(false)
  }, [update])
  const stale = !data.rate || now - data.rate.at > 120_000
  useEffect(() => {
    // First fetch on the next tick, then retry every minute while the rate is stale (offline at launch,
    // lost signal), else every 10 minutes.
    const first = setTimeout(refresh, 0)
    const id = setInterval(refresh, stale ? 60_000 : 600_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [refresh, stale])

  const adj = data.shop?.adjustPct ?? 0
  const cached = data.rate
  const fresh = cached && now - cached.at < RATE_MAX_AGE_MS
  let view: RateView
  if (data.manualRate) view = { kind: 'manual', value: adjusted(data.manualRate, adj) }
  else if (loading && !cached) view = { kind: 'loading' }
  else if (cached && fresh)
    view = { kind: loading || now - cached.at < 120_000 ? 'live' : 'offline', value: adjusted(cached.value, adj), at: cached.at, disagree: cached.disagree }
  else view = { kind: 'manual-needed' }
  const setManual = (v: number | null) => update((d) => ({ ...d, manualRate: v }))
  return { view, refresh, setManual }
}

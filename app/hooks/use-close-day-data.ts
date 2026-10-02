import { lagosDay } from '@/core/rewards'
import { useStore } from '@/state/store'
import { useRewardLines } from './use-close-day'

/** Totals for the Close screen plus every reward still owed. */
export function useCloseDayData(now: number) {
  const { data } = useStore()
  const lines = useRewardLines()
  const day = lagosDay(now)
  const paid = data.sales.filter((s) => s.day === day && ['paid', 'overpaid', 'underpaid'].includes(s.state))
  return { day, lines, count: paid.length, nairaTotal: paid.reduce((n, s) => n + s.naira, 0) }
}

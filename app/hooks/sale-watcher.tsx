import { address } from '@solana/kit'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { TIMING } from '@/constants/app-config'
import { findSale, SaleStatus } from '@/core/detect'
import { findByAmount } from '@/core/match-amount'
import { getSgtMint } from '@/core/sgt'
import { useRpc } from '@/hooks/use-rpc'
import { useStore } from '@/state/store'
import { StoredSale } from '@/state/types'
import { toSale } from '@/state/convert'
import { markChecked, setOnline } from './online'

/** Polls open sales in the background so a payment confirms even if the till screen was left. */
export function SaleWatcher() {
  const rpc = useRpc()
  const { data, patchSale } = useStore()
  const latest = useRef(data)
  useLayoutEffect(() => {
    latest.current = data
  })
  const lastSlow = useRef(0)

  useEffect(() => {
    let stop = false
    let busy = false
    const tick = async () => {
      if (busy) return
      busy = true
      try {
        await runBatch()
      } finally {
        busy = false
      }
    }
    const runBatch = async () => {
      const open = latest.current.sales.filter((s) => s.state === 'waiting').sort((a, b) => b.createdAt - a.createdAt)
      const slowDue = Date.now() - lastSlow.current > TIMING.pollSlowMs
      if (slowDue) lastSlow.current = Date.now()
      const batch = slowDue ? open : open.slice(0, TIMING.maxFastSales)
      for (const s of batch) {
        if (stop) return
        await checkOne(s, open)
          .then(() => {
            setOnline(true)
            markChecked()
          })
          .catch(() => setOnline(false)) // offline: try again next tick
      }
    }
    const checkOne = async (s: StoredSale, open: StoredSale[]) => {
      const sale = toSale(s)
      const all = latest.current.sales
      const usedSignatures = new Set(all.flatMap((o) => o.signatures ?? (o.signature ? [o.signature] : [])))
      const otherReferences = new Set(open.filter((o) => o.id !== s.id).map((o) => o.reference))
      let st: SaleStatus = await findSale(rpc, sale, { usedSignatures, otherReferences })
      let matchedBy: 'reference' | 'amount' = 'reference'
      const twin = open.some((o) => o.id !== s.id && o.coin === s.coin && o.expected === s.expected)
      if (st.kind === 'waiting' && !twin) {
        st = await findByAmount(rpc, sale, usedSignatures)
        matchedBy = 'amount'
      }
      if (st.kind === 'waiting') return
      const sgtMint = await getSgtMint(rpc, address(st.payer)).catch(() => null)
      const rewards = (latest.current.shop?.rewardPct ?? 0) > 0
      patchSale(s.id, {
        state: st.kind,
        matchedBy,
        received: st.received.toString(),
        payer: st.payer,
        signature: st.signature,
        signatures: st.signatures,
        paidAt: Date.now(),
        sgtMint,
        reward: sgtMint && rewards ? 'pending' : 'none',
      })
      // Credit these signatures immediately so the next sale in this tick cannot reuse them.
      latest.current = { ...latest.current, sales: latest.current.sales.map((o) => (o.id === s.id ? { ...o, signatures: st.signatures } : o)) }
    }
    const id = setInterval(() => void tick(), TIMING.pollFastMs)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [rpc, patchSale])
  return null
}

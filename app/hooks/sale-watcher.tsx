import { useEffect, useLayoutEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { checkSale } from './check-sale'
import { sendPaidAlert } from './paid-alert'
import { TIMING } from '@/constants/app-config'
import { useRpc } from '@/hooks/use-rpc'
import { useStore } from '@/state/store'
import { StoredSale } from '@/state/types'
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
        await checkOne(s)
          .then(() => {
            setOnline(true)
            markChecked()
          })
          .catch(() => setOnline(false)) // offline: try again next tick
      }
    }
    const checkOne = async (s: StoredSale) => {
      const patch = await checkSale(rpc, s, latest.current)
      if (!patch) return
      patchSale(s.id, patch)
      if (AppState.currentState !== 'active') void sendPaidAlert(s, patch) // shop is in WhatsApp, Telegram, or the phone is locked
      // Credit these signatures immediately so the next sale in this tick cannot reuse them.
      latest.current = { ...latest.current, sales: latest.current.sales.map((o) => (o.id === s.id ? { ...o, ...patch } : o)) }
    }
    const id = setInterval(() => void tick(), TIMING.pollFastMs)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [rpc, patchSale])
  return null
}

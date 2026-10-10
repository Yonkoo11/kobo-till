import { useEffect, useLayoutEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { backoffMs } from '@/core/backoff'
import { isOffline } from '@/core/wallet-error'
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
    let failures = 0 // failed rounds in a row; a busy server (429) or no network backs the polling off
    let pausedUntil = 0
    const tick = async () => {
      if (busy || Date.now() < pausedUntil) return
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
      if (batch.length === 0) return
      let ok = false
      let offline = false
      let failed = false
      for (const s of batch) {
        if (stop) return
        await checkOne(s)
          .then(() => {
            ok = true
            markChecked()
          })
          .catch((e: unknown) => {
            failed = true
            if (isOffline(e)) offline = true
          })
      }
      // "No internet" only when the phone could not reach Solana at all; a server that refuses (rate limit) is
      // not the shop's connection, so the flag is left alone and the next round waits longer.
      if (ok) setOnline(true)
      else if (offline) setOnline(false)
      failures = failed ? failures + 1 : 0
      pausedUntil = failed ? Date.now() + backoffMs(failures) : 0
    }
    const checkOne = async (s: StoredSale) => {
      const patch = await checkSale(rpc, s, latest.current)
      if (!patch) return
      patchSale(s.id, patch)
      if (AppState.currentState !== 'active') void sendPaidAlert(s, patch) // shop is in WhatsApp, Telegram, or the phone is locked
      // Credit these signatures immediately so the next sale in this tick cannot reuse them.
      latest.current = {
        ...latest.current,
        sales: latest.current.sales.map((o) => (o.id === s.id ? { ...o, ...patch } : o)),
      }
    }
    const id = setInterval(() => void tick(), TIMING.pollFastMs)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [rpc, patchSale])
  return null
}

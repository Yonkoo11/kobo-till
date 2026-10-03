import { useSyncExternalStore } from 'react'

let online = true
const subs = new Set<() => void>()

export function setOnline(v: boolean) {
  if (v === online) return
  online = v
  subs.forEach((f) => f())
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => online,
  )
}

// Time of the last successful Solana check, shown on the Waiting screen ("Checked hh:mm:ss").
let lastCheck = 0
const checkSubs = new Set<() => void>()

export function markChecked() {
  lastCheck = Date.now()
  checkSubs.forEach((f) => f())
}

export function useLastCheck(): number {
  return useSyncExternalStore(
    (f) => {
      checkSubs.add(f)
      return () => checkSubs.delete(f)
    },
    () => lastCheck,
  )
}

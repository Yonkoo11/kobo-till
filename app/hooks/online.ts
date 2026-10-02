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

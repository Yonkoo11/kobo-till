import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { EMPTY, KoboData, StoredSale } from './types'

export const STORE_KEY = 'kobo:v1'
const KEY = STORE_KEY

// Set while the app's store is mounted, so a background check in the same JavaScript runtime patches the live state
// instead of writing the saved copy underneath it (the next save would overwrite that write).
export let livePatchSale: ((id: string, patch: Partial<StoredSale>) => void) | null = null

interface StoreValue {
  ready: boolean
  data: KoboData
  update: (fn: (d: KoboData) => KoboData) => void
  patchSale: (id: string, patch: Partial<StoredSale>) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<KoboData>(EMPTY)
  const [ready, setReady] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setData({ ...EMPTY, ...JSON.parse(raw) }))
      .catch(() => undefined)
      .finally(() => {
        loaded.current = true
        setReady(true)
      })
  }, [])

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => undefined)
  }, [data])

  const update = useCallback((fn: (d: KoboData) => KoboData) => setData((d) => fn(d)), [])
  const patchSale = useCallback(
    (id: string, patch: Partial<StoredSale>) =>
      setData((d) => ({ ...d, sales: d.sales.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
    [],
  )
  useEffect(() => {
    livePatchSale = patchSale
    return () => {
      livePatchSale = null
    }
  }, [patchSale])
  const value = useMemo(() => ({ ready, data, update, patchSale }), [ready, data, update, patchSale])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext)
  if (!v) throw new Error('useStore outside StoreProvider')
  return v
}

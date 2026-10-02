import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { EMPTY, KoboData, StoredSale } from './types'

const KEY = 'kobo:v1'

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
  const value = useMemo(() => ({ ready, data, update, patchSale }), [ready, data, update, patchSale])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext)
  if (!v) throw new Error('useStore outside StoreProvider')
  return v
}

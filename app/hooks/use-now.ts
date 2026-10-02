import { useEffect, useState } from 'react'

/** Current time, refreshed every `everyMs`, so screens never read the clock during render. */
export function useNow(everyMs = 5000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs)
    return () => clearInterval(id)
  }, [everyMs])
  return now
}

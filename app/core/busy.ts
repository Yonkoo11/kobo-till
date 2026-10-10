/** Solana's server refused the call for load (HTTP 429), not because anything is wrong with the request or the phone. */
export function isBusy(e: unknown): boolean {
  const s = String((e as { message?: string })?.message ?? e).toLowerCase()
  return /429|too many requests|8100002/.test(s)
}

const WAITS_MS = [1000, 2000, 4000]

/**
 * Runs `fn`; a busy answer is retried after 1, 2 and 4 seconds (three retries, seven seconds in all), then thrown.
 * Any other failure is thrown at once. The public mainnet server answers 429 under load (refund failed on it, 2026-10-10).
 */
export async function retryWhenBusy<T>(fn: () => Promise<T>, sleep: (ms: number) => Promise<void> = wait): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (e) {
      if (!isBusy(e) || attempt >= WAITS_MS.length) throw e
      await sleep(WAITS_MS[attempt])
    }
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

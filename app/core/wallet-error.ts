/** Which of the known wallet failures happened, from the error a Mobile Wallet Adapter call throws. */
export type WalletFailure = 'offline' | 'cancelled' | 'expired' | 'no-sol' | 'other'

/**
 * True only when the phone could not reach the server at all (seen 2026-10-06: "fetch failed: java.net.ConnectException").
 * A server that answers with an error (429 Too Many Requests, a JSON-RPC error) is NOT offline.
 */
export function isOffline(e: unknown): boolean {
  const s = String((e as { message?: string })?.message ?? e).toLowerCase()
  return /fetch failed|network request failed|connectexception|unknownhost|timed? ?out|econn/.test(s)
}

export function walletFailure(e: unknown): WalletFailure {
  const s = String((e as { message?: string })?.message ?? e).toLowerCase()
  if (isOffline(e)) return 'offline'
  if (/declin|cancel|reject|not authori[sz]ed|user/.test(s)) return 'cancelled'
  if (/blockhash|expired|block height exceeded/.test(s)) return 'expired'
  if (/insufficient|lamports|fee payer|0x1\b|debit an account/.test(s)) return 'no-sol'
  return 'other'
}

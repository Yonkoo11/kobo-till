import { isBusy } from './busy'
/** Which of the known wallet failures happened, from the error a Mobile Wallet Adapter call throws. */
export type WalletFailure = 'offline' | 'busy' | 'cancelled' | 'expired' | 'no-sol' | 'no-answer' | 'other'

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
  // The wallet took the request and never answered (Phantom sat on a sign request for 90 s, 2026-10-11). The phone
  // was online; the wallet was the one silent.
  if (/timed out waiting for response/.test(s)) return 'no-answer'
  if (isOffline(e)) return 'offline'
  if (isBusy(e)) return 'busy'
  if (/declin|cancel|reject|not authori[sz]ed|user/.test(s)) return 'cancelled'
  if (/blockhash|expired|block height exceeded/.test(s)) return 'expired'
  if (/insufficient|lamports|fee payer|0x1\b|debit an account/.test(s)) return 'no-sol'
  return 'other'
}

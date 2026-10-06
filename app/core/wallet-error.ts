/** Which of the known wallet failures happened, from the error a Mobile Wallet Adapter call throws. */
export type WalletFailure = 'offline' | 'cancelled' | 'expired' | 'no-sol' | 'other'

export function walletFailure(e: unknown): WalletFailure {
  const s = String((e as { message?: string })?.message ?? e).toLowerCase()
  // The phone could not reach Solana (seen 2026-10-06: "fetch failed: java.net.ConnectException").
  if (/fetch failed|network request failed|connectexception|unknownhost|timed? ?out|econn/.test(s)) return 'offline'
  if (/declin|cancel|reject|not authori[sz]ed|user/.test(s)) return 'cancelled'
  if (/blockhash|expired|block height exceeded/.test(s)) return 'expired'
  if (/insufficient|lamports|fee payer|0x1\b|debit an account/.test(s)) return 'no-sol'
  return 'other'
}

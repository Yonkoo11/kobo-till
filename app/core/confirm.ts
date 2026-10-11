import { type Rpc, type Signature, type SolanaRpcApi } from '@solana/kit'

/** Poll until the signature is confirmed; throws if it failed on chain or did not land in time. */
export async function waitConfirmed(rpc: Rpc<SolanaRpcApi>, sig: string, what = 'transaction', timeoutMs = 45000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    const { value } = await rpc.getSignatureStatuses([sig as Signature]).send()
    const st = value[0]
    if (st?.err) throw new Error(`${what} failed on chain`)
    if (st && (st.confirmationStatus === 'confirmed' || st.confirmationStatus === 'finalized')) return
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error(`${what} not confirmed in time`)
}

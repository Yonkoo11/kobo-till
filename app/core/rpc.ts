import { createDefaultRpcTransport, createSolanaRpcFromTransport, type Rpc, type RpcTransport, type SolanaRpcApi } from '@solana/kit'
import { retryWhenBusy } from './busy'

/** The app's Solana connection: every call retries a busy (429) answer before failing. */
export function createKoboRpc(url: string): Rpc<SolanaRpcApi> {
  const base = createDefaultRpcTransport({ url })
  const transport: RpcTransport = (...args) => retryWhenBusy(() => base(...args))
  return createSolanaRpcFromTransport(transport) as unknown as Rpc<SolanaRpcApi>
}

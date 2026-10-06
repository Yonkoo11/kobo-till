import { Address, Rpc, SolanaRpcApi } from '@solana/kit'

/**
 * Lamports a shop wallet needs for one Kobo transaction: the base fee plus a margin for a priority fee, and the
 * rent for a token account when the recipient has none yet (about 0.002 SOL). A shop that only ever receives USDC
 * starts with no SOL, so refunds and rewards would fail without this check (seen on mainnet 2026-10-06).
 */
export const FEE_LAMPORTS = 50_000n
export const TOKEN_ACCOUNT_RENT = 2_039_280n

export async function solShortfall(rpc: Rpc<SolanaRpcApi>, owner: Address, needsTokenAccount = false): Promise<bigint> {
  const { value } = await rpc.getBalance(owner, { commitment: 'confirmed' }).send()
  const need = FEE_LAMPORTS + (needsTokenAccount ? TOKEN_ACCOUNT_RENT : 0n)
  return value >= need ? 0n : need - value
}

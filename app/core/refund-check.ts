import { Address, Rpc, SolanaRpcApi } from '@solana/kit'
import { balanceDelta } from './detect'
import { ata } from './tokens'

/**
 * Signature of a transfer from the shop to `payer` of `mint` made after `sinceMs`, if one exists.
 * Run before every refund so a refund that broadcast but returned an error is never sent twice.
 */
export async function findPriorRefund(
  rpc: Rpc<SolanaRpcApi>,
  shop: Address,
  payer: string,
  mint: Address,
  sinceMs: number,
): Promise<string | null> {
  const account = await ata(shop, mint)
  const sigs = await rpc.getSignaturesForAddress(account, { commitment: 'confirmed', limit: 25 }).send()
  for (const s of sigs.filter((x) => !x.err && Number(x.blockTime ?? 0) * 1000 >= sinceMs)) {
    const tx = await rpc
      .getTransaction(s.signature, { commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 })
      .send()
    const pre = (tx?.meta?.preTokenBalances ?? []) as never[]
    const post = (tx?.meta?.postTokenBalances ?? []) as never[]
    if (balanceDelta(pre, post, shop, mint) < 0n && balanceDelta(pre, post, payer, mint) > 0n) return s.signature
  }
  return null
}

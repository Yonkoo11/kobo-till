import { Address, Rpc, SolanaRpcApi } from '@solana/kit'
import { COINS } from './constants'
import { balanceDelta, findPayer, SaleStatus } from './detect'
import { Sale } from './sale'
import { ata } from './tokens'

/**
 * Fallback when a wallet drops the reference (F-018): the shop's token account received exactly the
 * expected amount of the sale's coin after the sale was created. Callers must not use this when two
 * open sales share the same coin and amount.
 */
export async function findByAmount(rpc: Rpc<SolanaRpcApi>, sale: Sale, usedSignatures: Set<string>): Promise<SaleStatus> {
  const mint = COINS[sale.coin].mint
  const account = await ata(sale.recipient as Address, mint)
  const sigs = await rpc.getSignaturesForAddress(account, { commitment: 'confirmed', limit: 10 }).send()
  const since = Math.floor(sale.createdAt / 1000) - 5
  for (const s of sigs.filter((x) => !x.err && !usedSignatures.has(x.signature) && Number(x.blockTime ?? 0) >= since).reverse()) {
    const tx = await rpc
      .getTransaction(s.signature, { commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 1 })
      .send()
    const pre = (tx?.meta?.preTokenBalances ?? []) as never[]
    const post = (tx?.meta?.postTokenBalances ?? []) as never[]
    const received = balanceDelta(pre, post, sale.recipient, mint)
    if (received === sale.expected) {
      return { kind: 'paid', received, payer: findPayer(pre, post, mint, '?'), signature: s.signature, signatures: [s.signature] }
    }
  }
  return { kind: 'waiting' }
}

import { Address, Rpc, Signature, SolanaRpcApi } from '@solana/kit'
import { COINS } from './constants'
import { Sale } from './sale'

export type SaleStatus =
  | { kind: 'waiting' }
  | { kind: 'paid' | 'overpaid' | 'underpaid'; received: bigint; payer: string; signature: string }

type TokenBalance = { mint: string; owner?: string; uiTokenAmount: { amount: string } }

/** Net change of `owner`'s balance of `mint` across one transaction, in base units. */
export function balanceDelta(pre: TokenBalance[], post: TokenBalance[], owner: string, mint: string): bigint {
  const sum = (list: TokenBalance[]) =>
    list.filter((b) => b.owner === owner && b.mint === mint).reduce((t, b) => t + BigInt(b.uiTokenAmount.amount), 0n)
  return sum(post) - sum(pre)
}

/** The account whose balance of `mint` went down the most: the payer. */
export function findPayer(pre: TokenBalance[], post: TokenBalance[], mint: string, fallback: string): string {
  const owners = new Set([...pre, ...post].filter((b) => b.mint === mint && b.owner).map((b) => b.owner!))
  let best = fallback
  let most = 0n
  for (const o of owners) {
    const d = balanceDelta(pre, post, o, mint)
    if (d < most) [best, most] = [o, d]
  }
  return best
}

export function classify(expected: bigint, received: bigint): 'paid' | 'overpaid' | 'underpaid' {
  if (received === expected) return 'paid'
  return received > expected ? 'overpaid' : 'underpaid'
}

/** Look up a sale by its Solana Pay reference and validate recipient, mint and amount. */
export async function findSale(rpc: Rpc<SolanaRpcApi>, sale: Sale): Promise<SaleStatus> {
  const sigs = await rpc.getSignaturesForAddress(sale.reference, { commitment: 'confirmed', limit: 10 }).send()
  for (const s of sigs.filter((x) => !x.err).reverse()) {
    const status = await checkSignature(rpc, sale, s.signature)
    if (status) return status
  }
  return { kind: 'waiting' }
}

async function checkSignature(rpc: Rpc<SolanaRpcApi>, sale: Sale, signature: Signature): Promise<SaleStatus | null> {
  const tx = await rpc
    .getTransaction(signature, { commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 })
    .send()
  if (!tx?.meta || tx.meta.err) return null
  const pre = (tx.meta.preTokenBalances ?? []) as unknown as TokenBalance[]
  const post = (tx.meta.postTokenBalances ?? []) as unknown as TokenBalance[]
  const mint = COINS[sale.coin].mint
  const received = balanceDelta(pre, post, sale.recipient, mint)
  if (received <= 0n) return null // wrong token or wrong recipient: not this sale
  const feePayer = String((tx.transaction.message.accountKeys[0] as { pubkey: Address }).pubkey)
  const payer = findPayer(pre, post, mint, feePayer)
  return { kind: classify(sale.expected, received), received, payer, signature }
}

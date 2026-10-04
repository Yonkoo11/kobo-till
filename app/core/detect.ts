import { Address, Rpc, Signature, SolanaRpcApi } from '@solana/kit'
import { COINS } from './constants'
import { Sale } from './sale'

export type SaleStatus =
  | { kind: 'waiting' }
  | { kind: 'paid' | 'overpaid' | 'underpaid'; received: bigint; payer: string; signature: string; signatures: string[] }

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

/** Payments below this many base units (0.01 coin) are ignored, so dust cannot lock a sale. */
export const DUST = 10_000n

export interface Exclusions {
  usedSignatures: Set<string> // signatures already credited to another sale
  otherReferences: Set<string> // references of other open sales
}

/**
 * Look up a sale by its Solana Pay reference and validate recipient, mint and amount. Every valid
 * payment carrying the reference is summed; a signature already credited elsewhere, or one that also
 * carries another open sale's reference, is never counted.
 */
export async function findSale(rpc: Rpc<SolanaRpcApi>, sale: Sale, ex: Exclusions): Promise<SaleStatus> {
  const sigs = await rpc.getSignaturesForAddress(sale.reference, { commitment: 'confirmed', limit: 20 }).send()
  let received = 0n
  const credited: string[] = []
  let first: { payer: string; signature: string; amount: bigint } | null = null
  for (const s of sigs.filter((x) => !x.err && !ex.usedSignatures.has(x.signature)).reverse()) {
    const hit = await checkSignature(rpc, sale, s.signature, ex.otherReferences)
    if (!hit || hit.amount < DUST) continue
    received += hit.amount
    credited.push(hit.signature)
    if (!first || hit.amount > first.amount) first = hit
  }
  if (!first) return { kind: 'waiting' }
  return { kind: classify(sale.expected, received), received, payer: first.payer, signature: first.signature, signatures: credited }
}

async function checkSignature(rpc: Rpc<SolanaRpcApi>, sale: Sale, signature: Signature, otherRefs: Set<string>) {
  const tx = await rpc
    .getTransaction(signature, { commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 1 })
    .send()
  if (!tx?.meta || tx.meta.err) return null
  const keys = (tx.transaction.message.accountKeys as unknown as { pubkey: Address }[]).map((k) => String(k.pubkey))
  if (keys.some((k) => otherRefs.has(k))) return null // one transfer may not pay two sales
  const pre = (tx.meta.preTokenBalances ?? []) as unknown as TokenBalance[]
  const post = (tx.meta.postTokenBalances ?? []) as unknown as TokenBalance[]
  const mint = COINS[sale.coin].mint
  const amount = balanceDelta(pre, post, sale.recipient, mint)
  if (amount <= 0n) return null // wrong token or wrong recipient: not this sale
  return { amount, payer: findPayer(pre, post, mint, keys[0]), signature: String(signature) }
}

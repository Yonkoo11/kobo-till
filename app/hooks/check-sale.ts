import { address, Rpc, SolanaRpcApi } from '@solana/kit'
import { findSale, SaleStatus } from '@/core/detect'
import { findByAmount } from '@/core/match-amount'
import { getSgtMint } from '@/core/sgt'
import { toSale } from '@/state/convert'
import { KoboData, StoredSale } from '@/state/types'

/**
 * One check of one open sale: by reference first, then by exact amount when no other open sale owes the same amount.
 * Returns the fields to save when the sale is settled, or null while it is still waiting. Shared by the in-app
 * watcher and the background check, so both apply the same rules.
 */
export async function checkSale(rpc: Rpc<SolanaRpcApi>, s: StoredSale, data: KoboData): Promise<Partial<StoredSale> | null> {
  const open = data.sales.filter((o) => o.state === 'waiting')
  const sale = toSale(s)
  const usedSignatures = new Set(data.sales.flatMap((o) => o.signatures ?? (o.signature ? [o.signature] : [])))
  const otherReferences = new Set(open.filter((o) => o.id !== s.id).map((o) => o.reference))
  let st: SaleStatus = await findSale(rpc, sale, { usedSignatures, otherReferences })
  let matchedBy: 'reference' | 'amount' = 'reference'
  const twin = open.some((o) => o.id !== s.id && o.coin === s.coin && o.expected === s.expected)
  if (st.kind === 'waiting' && !twin) {
    st = await findByAmount(rpc, sale, usedSignatures)
    matchedBy = 'amount'
  }
  if (st.kind === 'waiting') return null
  const sgtMint = await getSgtMint(rpc, address(st.payer)).catch(() => null)
  const rewards = (data.shop?.rewardPct ?? 0) > 0
  return {
    state: st.kind,
    matchedBy,
    received: st.received.toString(),
    payer: st.payer,
    signature: st.signature,
    signatures: st.signatures,
    paidAt: Date.now(),
    sgtMint,
    reward: sgtMint && rewards ? 'pending' : 'none',
  }
}

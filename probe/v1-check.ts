// probe: find a recent version 1 USDC transaction on mainnet and read it with the app's own balance code.
import { createSolanaRpc } from '@solana/kit'
import { COINS } from '../app/core/constants'
import { balanceDelta } from '../app/core/detect'
import { formatCoins } from '../app/core/sale'
import { RPC_URL } from './_args'

const rpc = createSolanaRpc(RPC_URL)
const sigs = await rpc.getSignaturesForAddress(COINS.USDC.mint, { limit: 60 }).send()
for (const s of sigs.filter((x) => !x.err)) {
  await new Promise((r) => setTimeout(r, 1500))
  const tx = await rpc.getTransaction(s.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 1 }).send()
  if (tx?.version !== 1) continue
  const pre = (tx.meta?.preTokenBalances ?? []) as any[]
  const post = (tx.meta?.postTokenBalances ?? []) as any[]
  const owners = [...new Set(post.filter((b) => b.mint === COINS.USDC.mint).map((b) => b.owner))]
  const recv = owners.find((o) => balanceDelta(pre, post, o, COINS.USDC.mint) > 0n)
  console.log(`version 1 sig ${s.signature}`)
  console.log(recv ? `${recv} received ${formatCoins(balanceDelta(pre, post, recv, COINS.USDC.mint))} USDC` : 'no USDC receiver in this one')
  process.exit(0)
}
console.log('no version 1 transaction in the last 60 USDC signatures')

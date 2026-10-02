// probe: run the app's validation on a real recent USDC TransferChecked on mainnet.
import { createSolanaRpc } from '@solana/kit'
import { COINS } from '../app/core/constants'
import { balanceDelta, classify, findPayer } from '../app/core/detect'
import { formatCoins } from '../app/core/sale'
import { RPC_URL } from './_args'

const rpc = createSolanaRpc(RPC_URL)
const sigs = await rpc.getSignaturesForAddress(COINS.USDC.mint, { limit: 25 }).send()
for (const s of sigs.filter((x) => !x.err)) {
  const tx = await rpc.getTransaction(s.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }).send()
  const pre = (tx?.meta?.preTokenBalances ?? []) as any[]
  const post = (tx?.meta?.postTokenBalances ?? []) as any[]
  const owners = [...new Set(post.filter((b) => b.mint === COINS.USDC.mint).map((b) => b.owner))]
  const recv = owners.find((o) => balanceDelta(pre, post, o, COINS.USDC.mint) > 0n)
  if (!recv || owners.length !== 2) continue // want a simple two-party transfer
  const got = balanceDelta(pre, post, recv, COINS.USDC.mint)
  const payer = findPayer(pre, post, COINS.USDC.mint, '?')
  console.log(`sig ${s.signature}`)
  console.log(`recipient ${recv} received ${formatCoins(got)} USDC from ${payer}`)
  console.log(`as a sale expecting that amount: ${classify(got, got).toUpperCase()}; expecting +0.01: ${classify(got + 10000n, got).toUpperCase()}`)
  process.exit(0)
}
console.log('no simple two-party USDC transfer in the last 25 signatures; rerun')

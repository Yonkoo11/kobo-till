// helper: current holder of an NFT mint, read from its most recent transaction's token balances.
import { address, createSolanaRpc } from '@solana/kit'
import { arg, RPC_URL } from './_args'

const rpc = createSolanaRpc(RPC_URL)
const mint = arg('mint')
const [last] = await rpc.getSignaturesForAddress(address(mint), { limit: 1 }).send()
const tx = await rpc.getTransaction(last.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }).send()
const holder = (tx?.meta?.postTokenBalances ?? []).find((b: any) => b.mint === mint && b.uiTokenAmount.amount === '1')
if (!holder) throw new Error('no holder in last transaction')
console.log((holder as any).owner)

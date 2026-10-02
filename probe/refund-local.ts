// Local-network test of the app's refund code: transferIx builds the refund, findPriorRefund must then see it.
import { address, appendTransactionMessageInstructions, createKeyPairSignerFromPrivateKeyBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getSignatureFromTransaction, lamports, airdropFactory, pipe, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners, Instruction } from '@solana/kit'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { findPriorRefund } from '../app/core/refund-check'
import { transferIx } from '../app/core/tokens'

const RPC = 'http://127.0.0.1:8899'
const rpc = createSolanaRpc(RPC)
const subs = createSolanaRpcSubscriptions('ws://127.0.0.1:8900')
const send = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions: subs })
const cfg = JSON.parse(readFileSync(new URL('./.localnet.json', import.meta.url), 'utf8'))
const mint = address(cfg.mint)
const customer = await createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(cfg.seed))
const shop = await createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(randomBytes(32)))
await airdropFactory({ rpc, rpcSubscriptions: subs })({ recipientAddress: shop.address, lamports: lamports(1_000_000_000n), commitment: 'confirmed' })

async function run(signer: typeof shop, ixs: Instruction[]) {
  const { value: bh } = await rpc.getLatestBlockhash().send()
  const msg = pipe(createTransactionMessage({ version: 0 }), (m) => setTransactionMessageFeePayerSigner(signer, m), (m) => setTransactionMessageLifetimeUsingBlockhash(bh, m), (m) => appendTransactionMessageInstructions(ixs, m))
  const signed = await signTransactionMessageWithSigners(msg)
  await send(signed as never, { commitment: 'confirmed' })
  return getSignatureFromTransaction(signed)
}

// 1. customer pays the shop 1.51 (the sale), using the same builder
const t0 = Date.now() - 2000
await run(customer, await transferIx({ from: customer.address, to: shop.address, mint, decimals: 6, amount: 1_510_000n, createTo: true }))
console.log(`prior refund before refunding: ${await findPriorRefund(rpc, shop.address, customer.address, mint, t0)}`)
// 2. shop refunds with the app's builder (authority passed as an address, signed as fee payer, as the wallet does)
const ix = await transferIx({ from: shop.address, to: customer.address, mint, decimals: 6, amount: 1_480_000n, createTo: true })
const sig = await run(shop, ix)
const found = await findPriorRefund(rpc, shop.address, customer.address, mint, t0)
console.log(`refund sig ${sig.slice(0, 12)}…  prior refund found: ${found === sig ? 'YES, same signature' : found}`)

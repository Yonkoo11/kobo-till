// Plays the customer: pays a Kobo Solana Pay URL the way a wallet does (transferChecked + reference key).
// Local/devnet test networks only; uses the test payer from probe/.localnet.json.
import { AccountRole, address, appendTransactionMessageInstructions, createKeyPairSignerFromPrivateKeyBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, getSignatureFromTransaction, pipe, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from '@solana/kit'
import { findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstruction, getTransferCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'
import { readFileSync } from 'node:fs'
import { arg } from './_args'

const RPC = process.env.KOBO_TEST_RPC || 'http://127.0.0.1:8899'
if (!/127\.0\.0\.1|localhost|devnet/.test(RPC)) throw new Error('test networks only')
const rpc = createSolanaRpc(RPC)
const send = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions: createSolanaRpcSubscriptions(RPC.replace(/^http/, 'ws').replace(/:(\d+)$/, (_, p) => ':' + (Number(p) + 1))) })
const cfg = JSON.parse(readFileSync(new URL('./.localnet.json', import.meta.url), 'utf8'))
const payer = await createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(cfg.seed))

const url = new URL(arg('url').replace('solana:', 'solana://'))
const recipient = address(url.host || url.pathname.replace(/^\/+/, ''))
const mint = address(cfg.mint) // the test coin stands in for USDC
const units = BigInt(Math.round(Number(arg('amount', url.searchParams.get('amount') ?? '0')) * 1e6))
const reference = address(url.searchParams.get('reference')!)
const [from] = await findAssociatedTokenPda({ owner: payer.address, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS })
const [to] = await findAssociatedTokenPda({ owner: recipient, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS })
const transfer = getTransferCheckedInstruction({ source: from, mint, destination: to, authority: payer, amount: units, decimals: 6 })
const withRef = { ...transfer, accounts: [...transfer.accounts, { address: reference, role: AccountRole.READONLY }] }
const { value: bh } = await rpc.getLatestBlockhash().send()
const msg = pipe(
  createTransactionMessage({ version: 0 }),
  (m) => setTransactionMessageFeePayerSigner(payer, m),
  (m) => setTransactionMessageLifetimeUsingBlockhash(bh, m),
  (m) => appendTransactionMessageInstructions([getCreateAssociatedTokenIdempotentInstruction({ payer, ata: to, owner: recipient, mint }), withRef], m),
)
const signed = await signTransactionMessageWithSigners(msg)
await send(signed as never, { commitment: 'confirmed' })
console.log(`PAID ${Number(units) / 1e6} test-USDC to ${recipient} ref ${reference} sig ${getSignatureFromTransaction(signed)}`)

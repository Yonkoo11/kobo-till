// Creates a 6-decimal test "USDC" on devnet and a funded payer, for testing the Paid path with no real money.
// Writes probe/.devnet.json (gitignored): payer secret, test mint. Devnet only.
import { airdropFactory, appendTransactionMessageInstructions, createKeyPairSignerFromPrivateKeyBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, generateKeyPairSigner, getSignatureFromTransaction, lamports, pipe, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from '@solana/kit'
import { getCreateAccountInstruction } from '@solana-program/system'
import { findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstruction, getInitializeMintInstruction, getMintSize, getMintToInstruction, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

// KOBO_TEST_RPC=http://127.0.0.1:8899 targets a local solana-test-validator instead of devnet.
const RPC = process.env.KOBO_TEST_RPC || 'https://api.devnet.solana.com'
const rpc = createSolanaRpc(RPC)
const subs = createSolanaRpcSubscriptions(RPC.replace(/^http/, 'ws').replace(/:(\d+)$/, (_, p) => ':' + (Number(p) + 1))) // websocket = RPC port + 1
const send = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions: subs })
const FILE = new URL(process.env.KOBO_TEST_RPC ? './.localnet.json' : './.devnet.json', import.meta.url)

async function tx(payer: any, ixs: any[]) {
  const { value: bh } = await rpc.getLatestBlockhash().send()
  const msg = pipe(createTransactionMessage({ version: 0 }), (m) => setTransactionMessageFeePayerSigner(payer, m), (m) => setTransactionMessageLifetimeUsingBlockhash(bh, m), (m) => appendTransactionMessageInstructions(ixs, m))
  const signed = await signTransactionMessageWithSigners(msg)
  await send(signed as any, { commitment: 'confirmed' })
  return getSignatureFromTransaction(signed)
}

const saved = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null
const seed = saved ? new Uint8Array(saved.seed) : new Uint8Array(randomBytes(32))
const payer = await createKeyPairSignerFromPrivateKeyBytes(seed)
if (!saved) {
  await airdropFactory({ rpc, rpcSubscriptions: subs })({ recipientAddress: payer.address, lamports: lamports(100_000_000n), commitment: 'confirmed' })
  const mint = await generateKeyPairSigner()
  const space = BigInt(getMintSize())
  const rent = await rpc.getMinimumBalanceForRentExemption(space).send()
  await tx(payer, [
    getCreateAccountInstruction({ payer, newAccount: mint, lamports: rent, space, programAddress: TOKEN_PROGRAM_ADDRESS }),
    getInitializeMintInstruction({ mint: mint.address, decimals: 6, mintAuthority: payer.address }),
  ])
  const [ata] = await findAssociatedTokenPda({ owner: payer.address, mint: mint.address, tokenProgram: TOKEN_PROGRAM_ADDRESS })
  await tx(payer, [
    getCreateAssociatedTokenIdempotentInstruction({ payer, ata, owner: payer.address, mint: mint.address }),
    getMintToInstruction({ mint: mint.address, token: ata, mintAuthority: payer, amount: 1_000_000_000n }),
  ])
  writeFileSync(FILE, JSON.stringify({ seed: Array.from(seed), payerAddress: payer.address, mint: mint.address }))
}
console.log(JSON.stringify({ payer: payer.address, mint: JSON.parse(readFileSync(FILE, 'utf8')).mint }))

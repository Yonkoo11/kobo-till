import { Address, getBase64Encoder, getTransactionDecoder, Transaction } from '@solana/kit'
import { COINS, SKR } from './constants'

const BASE = 'https://lite-api.jup.ag/swap/v1'

export interface Quote {
  outAmount: bigint
  minOut: bigint // otherAmountThreshold: the least SKR the swap can deliver
  raw: unknown
}

/** USDC -> SKR quote, 1% slippage (verified route 2026-10-02: 1 USDC -> 58.24 SKR). */
export async function quoteUsdcToSkr(usdcBase: bigint): Promise<Quote> {
  const q = new URLSearchParams({
    inputMint: COINS.USDC.mint,
    outputMint: SKR.mint,
    amount: usdcBase.toString(),
    slippageBps: '100',
  })
  const res = await fetch(`${BASE}/quote?${q}`)
  if (!res.ok) throw new Error(`quote ${res.status}`)
  const raw = await res.json()
  return { outAmount: BigInt(raw.outAmount), minOut: BigInt(raw.otherAmountThreshold), raw }
}

/** The swap as a ready transaction for the wallet to sign. */
export async function swapTransaction(quote: Quote, user: Address): Promise<Transaction> {
  const res = await fetch(`${BASE}/swap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ quoteResponse: quote.raw, userPublicKey: user, dynamicComputeUnitLimit: true }),
  })
  if (!res.ok) throw new Error(`swap ${res.status}`)
  const { swapTransaction: b64 } = await res.json()
  return getTransactionDecoder().decode(getBase64Encoder().encode(b64))
}

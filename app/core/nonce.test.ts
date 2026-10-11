import { describe, expect, it } from 'vitest'
import { address, appendTransactionMessageInstructions, type Blockhash, createTransactionMessage, type Instruction, pipe, setTransactionMessageFeePayer } from '@solana/kit'
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system'
import { createNonceIxs, nonceAddress, type ShopNonce, withLifetime } from './nonce'

const shop = address('BUzviZoMSNdTFo1mKMBfz4fuUTy1CE6wf4LQAe9Btjg9')
const other = address('HnsjaFN7Z1fuctcB1pRCd2Ddi9DjFfT3zetp4quK9Cf1')
const rpc = { getMinimumBalanceForRentExemption: () => ({ send: async () => 1_447_680n }) } as never
const blockhash = { blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi' as Blockhash, lastValidBlockHeight: 1n }
const memo: Instruction = { programAddress: address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), data: new Uint8Array([1]) }

describe('nonceAddress', () => {
  it('is stable for a shop and differs between shops', async () => {
    expect(await nonceAddress(shop)).toBe(await nonceAddress(shop))
    expect(await nonceAddress(shop)).not.toBe(await nonceAddress(other))
    expect(await nonceAddress(shop)).not.toBe(shop)
  })
})

describe('createNonceIxs', () => {
  it('creates the derived account with rent, then initialises it with the shop as authority', async () => {
    const [create, init] = await createNonceIxs(rpc, shop)
    const derived = await nonceAddress(shop)
    expect(create.programAddress).toBe(SYSTEM_PROGRAM_ADDRESS)
    expect(create.accounts?.map((a) => a.address)).toEqual([shop, derived])
    expect(init.programAddress).toBe(SYSTEM_PROGRAM_ADDRESS)
    expect(init.accounts?.[0].address).toBe(derived)
  })
})

describe('withLifetime', () => {
  const base = pipe(createTransactionMessage({ version: 0 }), (m) => setTransactionMessageFeePayer(shop, m))
  it('uses the blockhash when the shop has no nonce yet', () => {
    const m = pipe(base, (m) => withLifetime(m, blockhash, null), (m) => appendTransactionMessageInstructions([memo], m))
    expect(m.lifetimeConstraint).toEqual(blockhash)
    expect(m.instructions.map((i) => i.programAddress)).toEqual([memo.programAddress])
  })
  it('puts the advance-nonce step first when the shop has a nonce', async () => {
    const nonce: ShopNonce = { nonce: blockhash.blockhash as unknown as ShopNonce['nonce'], nonceAccountAddress: await nonceAddress(shop), nonceAuthorityAddress: shop }
    const m = pipe(base, (m) => withLifetime(m, blockhash, nonce), (m) => appendTransactionMessageInstructions([memo], m))
    expect(m.lifetimeConstraint).toEqual({ nonce: blockhash.blockhash })
    expect(m.instructions.map((i) => i.programAddress)).toEqual([SYSTEM_PROGRAM_ADDRESS, memo.programAddress])
    expect(m.instructions[0].accounts?.[0].address).toBe(nonce.nonceAccountAddress)
  })
})

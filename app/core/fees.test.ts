import { describe, expect, it } from 'vitest'
import { FEE_LAMPORTS, solShortfall, TOKEN_ACCOUNT_RENT } from './fees'

const rpcWith = (lamports: bigint) => ({ getBalance: () => ({ send: async () => ({ value: lamports }) }) }) as never

describe('solShortfall', () => {
  it('is zero when the wallet can pay the fee', async () => {
    expect(await solShortfall(rpcWith(FEE_LAMPORTS), 'x' as never)).toBe(0n)
  })
  it('says how much is missing for a wallet with no SOL', async () => {
    expect(await solShortfall(rpcWith(0n), 'x' as never)).toBe(FEE_LAMPORTS)
    expect(await solShortfall(rpcWith(0n), 'x' as never, true)).toBe(FEE_LAMPORTS + TOKEN_ACCOUNT_RENT)
  })
})

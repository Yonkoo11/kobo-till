import { address } from '@solana/kit'
import { describe, expect, it } from 'vitest'
import { createSale, formatCoins, MAX_NUDGE, saleUrl, uniqueAmount } from './sale'

const base = 120000n // 0.12 USDC
const args = {
  naira: 150,
  rate: 1329,
  coin: 'USDC' as const,
  recipient: address('BUzviZoMSNdTFo1mKMBfz4fuUTy1CE6wf4LQAe9Btjg9'),
  reference: address('7rar1XfRdgT9htUVMxcU9YZQ7j3i5YtqpZckzcwBdmU5'),
  label: 'Shop',
}

describe('uniqueAmount', () => {
  it('keeps the plain amount when no open sale owes it', () => {
    expect(uniqueAmount(base, [])).toBe(base)
    expect(uniqueAmount(base, [130000n])).toBe(base)
  })
  it('adds the fewest base units that make it unique', () => {
    expect(uniqueAmount(base, [base])).toBe(base + 1n)
    expect(uniqueAmount(base, [base, base + 1n, base + 3n])).toBe(base + 2n)
  })
  it('never reaches the next cent', () => {
    const taken = Array.from({ length: Number(MAX_NUDGE) }, (_, i) => base + BigInt(i))
    expect(uniqueAmount(base, taken)).toBe(base + MAX_NUDGE)
    expect(base + MAX_NUDGE).toBeLessThan(base + 10000n)
    expect(() => uniqueAmount(base, [...taken, base + MAX_NUDGE])).toThrow()
  })
})

describe('createSale with open sales', () => {
  it('two ₦150 sales owe different amounts, and the QR carries the exact one', () => {
    const first = createSale(args, 1)
    const second = createSale(args, 2, [first.expected])
    expect(formatCoins(first.expected)).toBe('0.12')
    expect(formatCoins(second.expected)).toBe('0.120001')
    expect(saleUrl(second)).toContain('amount=0.120001&')
  })
})

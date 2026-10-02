import { describe, expect, it } from 'vitest'
import { address } from '@solana/kit'
import { createSale, formatCoins, nairaToBaseUnits, newReference, saleUrl } from './sale'
import { balanceDelta, classify, findPayer } from './detect'
import { adjusted } from './rate'

const SHOP = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

describe('nairaToBaseUnits', () => {
  it('rounds ₦2,000 at 1328.57 up to 1.51 USDC', () => {
    expect(nairaToBaseUnits(2000, 1328.57, 6)).toBe(1_510_000n)
  })
  it('does not round an exact amount up', () => {
    expect(nairaToBaseUnits(1500, 1000, 6)).toBe(1_500_000n)
  })
  it('rejects zero and negative input', () => {
    expect(() => nairaToBaseUnits(0, 1328, 6)).toThrow()
    expect(() => nairaToBaseUnits(100, -1, 6)).toThrow()
  })
})

describe('formatCoins', () => {
  it('shows two decimals minimum', () => {
    expect(formatCoins(1_510_000n)).toBe('1.51')
    expect(formatCoins(1_500_000n)).toBe('1.50')
    expect(formatCoins(2_000_000n)).toBe('2')
    expect(formatCoins(10_000n)).toBe('0.01')
  })
})

describe('saleUrl', () => {
  it('builds a Solana Pay transfer request with mint and reference', () => {
    const reference = newReference((b) => b.fill(7))
    const sale = createSale({ naira: 2000, rate: 1328.57, coin: 'USDC', recipient: SHOP, reference, label: 'Mama Nkechi Provisions' })
    const url = saleUrl(sale)
    expect(url.startsWith(`solana:${SHOP}?amount=1.51&spl-token=${USDC}&reference=${reference}`)).toBe(true)
    expect(url).toContain('label=Mama%20Nkechi%20Provisions')
  })
})

describe('detection math', () => {
  const bal = (owner: string, amount: string) => ({ owner, mint: USDC, uiTokenAmount: { amount } })
  const pre = [bal(SHOP, '5000000'), bal('Payer1', '9000000')]
  const post = [bal(SHOP, '6510000'), bal('Payer1', '7490000')]
  it('measures what the shop received', () => {
    expect(balanceDelta(pre, post, SHOP, USDC)).toBe(1_510_000n)
  })
  it('ignores other mints', () => {
    expect(balanceDelta(pre, post, SHOP, 'OtherMint')).toBe(0n)
  })
  it('treats a first-time shop account (no pre balance) as received', () => {
    expect(balanceDelta([], [bal(SHOP, '1510000')], SHOP, USDC)).toBe(1_510_000n)
  })
  it('finds the payer as the biggest decrease', () => {
    expect(findPayer(pre, post, USDC, 'FeePayer')).toBe('Payer1')
  })
  it('classifies exact, short and over', () => {
    expect(classify(1_510_000n, 1_510_000n)).toBe('paid')
    expect(classify(1_510_000n, 1_210_000n)).toBe('underpaid')
    expect(classify(1_510_000n, 2_000_000n)).toBe('overpaid')
  })
})

describe('adjusted', () => {
  it('+2% makes the customer pay 2% more coins', () => {
    const base = nairaToBaseUnits(10000, 1000, 6)
    const more = nairaToBaseUnits(10000, adjusted(1000, 2), 6)
    expect(Number(more) / Number(base)).toBeCloseTo(1.02, 3)
  })
})

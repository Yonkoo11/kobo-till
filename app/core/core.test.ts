import { describe, expect, it } from 'vitest'
import { address } from '@solana/kit'
import { createSale, formatCoins, nairaToBaseUnits, newReference, saleUrl } from './sale'
import { balanceDelta, classify, findPayer } from './detect'
import { adjusted } from './rate'
import { lagosDay, rewardKey, rewardLines, saleRewardUsd, splitSkr } from './rewards'

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

describe('rewards', () => {
  const day = '2026-10-02'
  const base = { status: 'paid', day, reward: 'pending', expected: 10_000_000n }
  const sales = [
    { ...base, id: 'a', sgtMint: 'SGT1', payer: 'P1', received: 1_510_000n },
    { ...base, id: 'b', sgtMint: 'SGT1', payer: 'P1', received: 1_000_000n }, // same phone, same day
    { ...base, id: 'c', sgtMint: null, payer: 'P2', received: 5_000_000n }, // not a Seeker
    { ...base, id: 'd', sgtMint: 'SGT2', payer: 'P3', received: 2_000_000n, status: 'refunded' },
    { ...base, id: 'e', sgtMint: 'SGT3', payer: 'P4', received: 3_000_000n, day: '2026-10-01' }, // earlier day, still pending
    { ...base, id: 'f', sgtMint: 'SGT4', payer: 'P5', received: 3_000_000n, reward: 'skipped' },
    { ...base, id: 'g', sgtMint: 'SGT5', payer: 'P6', received: 1_000_000_000n, expected: 1_000_000n }, // overpaid 1000 USDC
  ]
  const lines = rewardLines(sales, 2, new Set())
  it("gives one line per Seeker token per day, summing that phone's purchases", () => {
    const l1 = lines.find((l) => l.sgtMint === 'SGT1')!
    expect(l1.usd).toBe(50_200n) // 2% of 2.51 USDC
    expect(l1.saleIds).toEqual(['a', 'b'])
  })
  it('keeps pending rewards from earlier days, drops skipped and refunded', () => {
    expect(lines.map((l) => l.sgtMint).sort()).toEqual(['SGT1', 'SGT3', 'SGT5'])
  })
  it('rewards the price, not an overpayment', () => {
    expect(lines.find((l) => l.sgtMint === 'SGT5')!.usd).toBe(20_000n) // 2% of 1 USDC, not of 1000
  })
  it('skips tokens already rewarded that day', () => {
    expect(rewardLines(sales, 2, new Set([rewardKey(day, 'SGT1')])).some((l) => l.sgtMint === 'SGT1')).toBe(false)
  })
  it('splits SKR in proportion and never over-spends', () => {
    const parts = splitSkr([{ usd: 1n }, { usd: 2n }], 100n)
    expect(parts).toEqual([33n, 66n])
  })
  it('computes the reward held back on refund', () => {
    expect(saleRewardUsd(1_510_000n, 1_510_000n, 2)).toBe(30_200n)
  })
  it('uses the Lagos calendar day', () => {
    expect(lagosDay(Date.UTC(2026, 9, 2, 23, 30))).toBe('2026-10-03')
    expect(lagosDay(Date.UTC(2026, 9, 2, 22, 59))).toBe('2026-10-02')
  })
})

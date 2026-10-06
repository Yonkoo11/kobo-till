import { address } from '@solana/kit'
import { describe, expect, it } from 'vitest'
import { parsePayLink } from '../../docs/pay/link.js'
import { createSale, saleUrl } from './sale'
import { PAY_PAGE, shareLink } from './share'

const sale = createSale({
  naira: 150,
  rate: 1329,
  coin: 'USDC',
  recipient: address('BUzviZoMSNdTFo1mKMBfz4fuUTy1CE6wf4LQAe9Btjg9'),
  reference: address('7rar1XfRdgT9htUVMxcU9YZQ7j3i5YtqpZckzcwBdmU5'),
  label: 'Mama Ngozi & Sons',
})

describe('shareLink', () => {
  it('opens the pay page and rebuilds the same Solana Pay link the QR shows', () => {
    const link = shareLink(sale)
    expect(link.startsWith(`${PAY_PAGE}#`)).toBe(true)
    const got = parsePayLink(new URL(link).hash)
    if (!got.ok) throw new Error(`refused: ${got.reason}`)
    expect(got.amount).toBe('0.12')
    expect(got.coin).toBe('USDC')
    expect(got.naira).toBe('150')
    expect(got.label).toBe('Mama Ngozi & Sons')
    expect(got.solanaUrl).toBe(saleUrl(sale))
  })

  it('carries USDT with its own mint', () => {
    const got = parsePayLink(new URL(shareLink({ ...sale, coin: 'USDT' })).hash)
    expect(got.ok && got.coin).toBe('USDT')
  })
})

describe('parsePayLink refuses a link it cannot vouch for', () => {
  const good = new URL(shareLink(sale)).hash
  const swap = (k: string, v: string) => {
    const p = new URLSearchParams(good.slice(1))
    p.set(k, v)
    return '#' + p.toString()
  }
  it.each([
    ['r', 'not-an-address', 'recipient'],
    ['a', '0', 'amount'],
    ['a', '1e9', 'amount'],
    ['a', '0.1234567', 'amount'],
    ['m', 'JUNoB7xJmckDgFkbV9aV4AeSCEtx4TxkbvWgWqNPXrq', 'coin'],
    ['ref', '', 'reference'],
    ['n', '-5', 'naira'],
  ])('%s=%s -> %s', (k, v, reason) => {
    expect(parsePayLink(swap(k, v))).toEqual({ ok: false, reason })
  })
  it('keeps a label with markup as plain text, cut to 64 characters', () => {
    const got = parsePayLink(swap('l', '<img src=x onerror=alert(1)>' + 'x'.repeat(80)))
    expect(got.ok && got.label.length).toBe(64)
    expect(got.ok && got.label.startsWith('<img')).toBe(true)
  })
  it('refuses an empty fragment', () => {
    expect(parsePayLink('').ok).toBe(false)
  })
})

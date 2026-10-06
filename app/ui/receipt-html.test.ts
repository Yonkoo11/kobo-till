import { describe, expect, it } from 'vitest'
import { StoredSale } from '@/state/types'
import { receiptHtml } from './receipt-html'

const sale: StoredSale = {
  id: 'r1', naira: 3500, rate: 1329, coin: 'USDC', recipient: 'BUzviZoMSNdTFo1mKMBfz4fuUTy1CE6wf4LQAe9Btjg9',
  reference: '7rar1XfRdgT9htUVMxcU9YZQ7j3i5YtqpZckzcwBdmU5', expected: '2640000', label: 'Shop', createdAt: Date.UTC(2026, 9, 6, 10),
  day: '2026-10-06', state: 'paid', matchedBy: 'amount', received: '2640000', payer: 'HnsjaFN7Z1fuctcB1pRCd2Ddi9DjFfT3zetp4quK9Cf1',
  signature: '3SFWF7r4spGYCJgxniqsXeDtEvDpu5oV2swKEvs2hLnajDktCHq3W1PoKUrf9Res5KRyHsNfwp6sJrkn92eUyezS', paidAt: Date.UTC(2026, 9, 6, 10, 1),
  reward: 'none', items: [1500, 2000],
}

describe('receiptHtml', () => {
  it('prints the total, the items, the coin, the payer and a QR to the payment', async () => {
    const html = await receiptHtml(sale, 'Mama Ngozi')
    expect(html).toContain('₦3,500')
    expect(html).toContain('₦1,500 + ₦2,000')
    expect(html).toContain('2.64 USDC')
    expect(html).toContain('Hnsj…9Cf1')
    expect(html).toContain('Paid (matched by amount)')
    expect(html).toContain('<svg')
  })
  it('escapes the shop name', async () => {
    const html = await receiptHtml(sale, '<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })
})

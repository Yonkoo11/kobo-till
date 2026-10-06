import QRCode from 'qrcode'
import { StoredSale } from '@/state/types'
import { copy } from './copy'
import { coins, dateText, hhmm, naira, rateText, short, solscan } from './format'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * A receipt laid out for 58 mm thermal paper (about 48 mm printable), printed through Android's print system:
 * Wi-Fi printers directly, Bluetooth receipt printers through a print-service app. Every value is escaped.
 */
export async function receiptHtml(sale: StoredSale, shopName: string): Promise<string> {
  const proof = sale.signature ? solscan(sale.signature) : ''
  const qr = proof ? await QRCode.toString(proof, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' }).catch(() => '') : ''
  const at = sale.paidAt ?? sale.createdAt
  const row = (k: string, v: string) => `<tr><td>${esc(k)}</td><td class="r">${esc(v)}</td></tr>`
  const status = sale.state === 'overpaid' ? copy.printOverpaid : sale.matchedBy === 'amount' ? copy.paidByAmountNote : copy.printPaid
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 58mm auto; margin: 4mm 3mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: sans-serif; font-size: 10pt; color: #000; width: 48mm; }
h1 { font-size: 12pt; text-align: center; margin-bottom: 1mm; }
.c { text-align: center; } .m { font-size: 8pt; } .big { font-size: 16pt; font-weight: bold; text-align: center; margin: 2mm 0 1mm; }
table { width: 100%; border-collapse: collapse; margin: 2mm 0; } td { padding: 0.6mm 0; vertical-align: top; } .r { text-align: right; }
hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0; }
.qr { width: 26mm; height: 26mm; margin: 2mm auto 1mm; } .qr svg { width: 100%; height: 100%; }
</style></head><body>
<h1>${esc(shopName)}</h1>
<p class="c m">${esc(dateText(at))} · ${esc(hhmm(at))}</p>
<hr>
<p class="big">₦${esc(naira(sale.naira))}</p>
<p class="c">${esc(status)}</p>
<table>
${sale.items?.length ? row(copy.receiptItems, sale.items.map((n) => `₦${naira(n)}`).join(' + ')) : ''}
${row(copy.receiptReceived, `${coins(sale.received ?? sale.expected)} ${sale.coin}`)}
${row(copy.receiptRate, `₦${rateText(sale.rate)} per $1`)}
${sale.payer ? row(copy.receiptFrom, short(sale.payer)) : ''}
</table>
<hr>
${qr ? `<div class="qr">${qr}</div><p class="c m">${esc(copy.printProof)}</p>` : ''}
<p class="c m">${esc(copy.printFooter)}</p>
</body></html>`
}

// node probe: prints the Solana Pay URL for a sale, using the app's own sale code.
import { address } from '@solana/kit'
import { randomFillSync } from 'node:crypto'
import { createSale, newReference, saleUrl } from '../app/core/sale'
import { arg } from './_args'

const sale = createSale({
  naira: Number(arg('naira')),
  rate: Number(arg('rate')),
  coin: arg('coin', 'USDC') as 'USDC' | 'USDT',
  recipient: address(arg('recipient')),
  reference: newReference((b) => randomFillSync(b)),
  label: arg('label', 'Kobo probe'),
})
console.log(saleUrl(sale))
console.log(`reference ${sale.reference}`)

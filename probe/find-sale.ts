// node probe: looks a sale up on chain by reference with the app's own detection code.
import { address, createSolanaRpc } from '@solana/kit'
import { COINS } from '../app/core/constants'
import { findSale } from '../app/core/detect'
import { createSale, formatCoins } from '../app/core/sale'
import { arg, RPC_URL } from './_args'

const coin = arg('coin', 'USDC') as 'USDC' | 'USDT'
const sale = {
  ...createSale({ naira: 1, rate: 1, coin, recipient: address(arg('recipient')), reference: address(arg('reference')), label: 'probe' }),
  expected: BigInt(Math.round(Number(arg('expect')) * 10 ** COINS[coin].decimals)),
}
const s = await findSale(createSolanaRpc(RPC_URL), sale)
if (s.kind === 'waiting') console.log('WAITING')
else if (s.kind === 'underpaid') console.log(`UNDERPAID got ${formatCoins(s.received)} want ${formatCoins(sale.expected)}`)
else console.log(`${s.kind.toUpperCase()} ${formatCoins(s.received)} ${coin} from ${s.payer} sig ${s.signature}`)

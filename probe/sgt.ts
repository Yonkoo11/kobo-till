// node probe: prints the Seeker Genesis Token mint an owner holds, with the app's own check.
import { address, createSolanaRpc } from '@solana/kit'
import { getSgtMint, hasSkrAccount } from '../app/core/sgt'
import { arg, RPC_URL } from './_args'

const rpc = createSolanaRpc(RPC_URL)
const owner = address(arg('owner'))
const mint = await getSgtMint(rpc, owner)
console.log(mint ? `SGT ${mint}` : 'NO SGT')
console.log((await hasSkrAccount(rpc, owner)) ? 'SKR account: yes' : 'SKR account: no')

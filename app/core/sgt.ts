import { Address, Rpc, SolanaRpcApi } from '@solana/kit'
import { SGT_GROUP, SKR, TOKEN_2022_PROGRAM } from './constants'
import { ata } from './tokens'

type ParsedAccount = { pubkey: Address; account: { data: { parsed: { info: any } } } }

/** Returns the Seeker Genesis Token mint held by `owner`, or null. Dedupe rewards by this mint. */
export async function getSgtMint(rpc: Rpc<SolanaRpcApi>, owner: Address): Promise<Address | null> {
  const res = await rpc
    .getTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM }, { encoding: 'jsonParsed', commitment: 'confirmed' })
    .send()
  const held = (res.value as unknown as ParsedAccount[])
    .map((a) => a.account.data.parsed.info)
    .filter((i) => i.tokenAmount?.amount === '1')
    .map((i) => i.mint as Address)
  if (held.length === 0) return null
  const mints = await rpc.getMultipleAccounts(held, { encoding: 'jsonParsed', commitment: 'confirmed' }).send()
  for (let i = 0; i < held.length; i++) {
    const exts = (mints.value[i]?.data as any)?.parsed?.info?.extensions ?? []
    if (exts.some((e: any) => e.extension === 'tokenGroupMember' && e.state?.group === SGT_GROUP)) return held[i]
  }
  return null
}

/**
 * True when `owner`'s associated SKR account exists, the exact account a reward transfer targets.
 * Rewards never create one (rent ≈ ₦242, more than a typical reward).
 */
export async function hasSkrAccount(rpc: Rpc<SolanaRpcApi>, owner: Address): Promise<boolean> {
  const res = await rpc.getAccountInfo(await ata(owner, SKR.mint), { encoding: 'base64' }).send()
  return res.value !== null
}

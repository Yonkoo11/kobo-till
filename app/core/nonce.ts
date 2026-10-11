import {
  type Address,
  createAddressWithSeed,
  type Instruction,
  type Nonce,
  type Rpc,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessageLifetimeUsingDurableNonce,
  type SolanaRpcApi,
  type TransactionMessage,
} from '@solana/kit'
import {
  fetchMaybeNonce,
  getCreateAccountWithSeedInstruction,
  getInitializeNonceAccountInstruction,
  getNonceSize,
  SYSTEM_PROGRAM_ADDRESS,
} from '@solana-program/system'

/** One nonce account per shop, derived from the shop's address, so nothing has to be stored. */
export const NONCE_SEED = 'kobo-refund-nonce'

export type ShopNonce = { nonce: Nonce; nonceAccountAddress: Address; nonceAuthorityAddress: Address }
type BlockhashLifetime = Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0]

export function nonceAddress(shop: Address): Promise<Address> {
  return createAddressWithSeed({ baseAddress: shop, programAddress: SYSTEM_PROGRAM_ADDRESS, seed: NONCE_SEED })
}

/** The shop's durable nonce, or null before the one-time setup. */
export async function readNonce(rpc: Rpc<SolanaRpcApi>, shop: Address): Promise<ShopNonce | null> {
  const account = await fetchMaybeNonce(rpc, await nonceAddress(shop), { commitment: 'confirmed' })
  if (!account.exists) return null
  return { nonce: account.data.blockhash as unknown as Nonce, nonceAccountAddress: account.address, nonceAuthorityAddress: shop }
}

/** One-time setup: the shop creates and owns its nonce account (rent stays refundable). */
export async function createNonceIxs(rpc: Rpc<SolanaRpcApi>, shop: Address): Promise<Instruction[]> {
  const space = BigInt(getNonceSize())
  const amount = await rpc.getMinimumBalanceForRentExemption(space).send()
  const newAccount = await nonceAddress(shop)
  return [
    getCreateAccountWithSeedInstruction({ payer: shop as never, newAccount, base: shop, seed: NONCE_SEED, amount, space, programAddress: SYSTEM_PROGRAM_ADDRESS }),
    getInitializeNonceAccountInstruction({ nonceAccount: newAccount, nonceAuthority: shop }),
  ]
}

/** A durable nonce never expires, so the shop can take as long as it likes to approve in the wallet. */
export function withLifetime<T extends TransactionMessage>(message: T, blockhash: BlockhashLifetime, nonce: ShopNonce | null) {
  return nonce ? setTransactionMessageLifetimeUsingDurableNonce(nonce, message) : setTransactionMessageLifetimeUsingBlockhash(blockhash, message)
}

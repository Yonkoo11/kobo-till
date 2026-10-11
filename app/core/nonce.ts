import {
  type Address,
  createAddressWithSeed,
  fetchEncodedAccount,
  type Instruction,
  type Nonce,
  type Rpc,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessageLifetimeUsingDurableNonce,
  type SolanaRpcApi,
  type TransactionMessage,
} from '@solana/kit'
import {
  decodeNonce,
  getAllocateWithSeedInstruction,
  getInitializeNonceAccountInstruction,
  getNonceSize,
  getTransferSolInstruction,
  SYSTEM_PROGRAM_ADDRESS,
} from '@solana-program/system'

/** One nonce account per shop, derived from the shop's address, so nothing has to be stored. */
export const NONCE_SEED = 'kobo-refund-nonce'

export type ShopNonce = { nonce: Nonce; nonceAccountAddress: Address; nonceAuthorityAddress: Address }
type BlockhashLifetime = Parameters<typeof setTransactionMessageLifetimeUsingBlockhash>[0]

export function nonceAddress(shop: Address): Promise<Address> {
  return createAddressWithSeed({ baseAddress: shop, programAddress: SYSTEM_PROGRAM_ADDRESS, seed: NONCE_SEED })
}

async function fetchNonceSlot(rpc: Rpc<SolanaRpcApi>, shop: Address) {
  return fetchEncodedAccount(rpc, await nonceAddress(shop), { commitment: 'confirmed' })
}

/** The shop's durable nonce, or null before the one-time setup (dust someone sent to the address does not count). */
export async function readNonce(rpc: Rpc<SolanaRpcApi>, shop: Address): Promise<ShopNonce | null> {
  const account = await fetchNonceSlot(rpc, shop)
  if (!account.exists || account.programAddress !== SYSTEM_PROGRAM_ADDRESS || account.data.length !== getNonceSize()) return null
  const { data, address } = decodeNonce(account)
  return { nonce: data.blockhash as unknown as Nonce, nonceAccountAddress: address, nonceAuthorityAddress: shop }
}

/**
 * One-time setup: the shop funds, sizes and initialises its nonce account (rent stays refundable).
 * Top-up + allocate instead of create-account, so lamports anyone dropped on the address beforehand cannot block it.
 */
export async function createNonceIxs(rpc: Rpc<SolanaRpcApi>, shop: Address): Promise<Instruction[]> {
  const space = BigInt(getNonceSize())
  const [rent, slot] = await Promise.all([rpc.getMinimumBalanceForRentExemption(space).send(), fetchNonceSlot(rpc, shop)])
  const newAccount = slot.address
  const shortfall = rent - (slot.exists ? slot.lamports : 0n)
  const base = shop as never
  return [
    ...(shortfall > 0n ? [getTransferSolInstruction({ source: base, destination: newAccount, amount: shortfall })] : []),
    getAllocateWithSeedInstruction({ newAccount, baseAccount: base, base: shop, seed: NONCE_SEED, space, programAddress: SYSTEM_PROGRAM_ADDRESS }),
    getInitializeNonceAccountInstruction({ nonceAccount: newAccount, nonceAuthority: shop }),
  ]
}

/** A durable nonce never expires, so the shop can take as long as it likes to approve in the wallet. */
export function withLifetime<T extends TransactionMessage>(message: T, blockhash: BlockhashLifetime, nonce: ShopNonce | null) {
  return nonce ? setTransactionMessageLifetimeUsingDurableNonce(nonce, message) : setTransactionMessageLifetimeUsingBlockhash(blockhash, message)
}

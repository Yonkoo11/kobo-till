import { useCallback } from 'react'
import {
  type Address,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  getAddressCodec,
  getBase58Decoder,
  getBase64Encoder,
  type Instruction,
  pipe,
  setTransactionMessageFeePayer,
  type Transaction,
} from '@solana/kit'
import { type KitMobileWallet, transact } from '@solana-mobile/mobile-wallet-adapter-protocol-kit'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { waitConfirmed } from '@/core/confirm'
import { createNonceIxs, readNonce, type ShopNonce, withLifetime } from '@/core/nonce'
import { useRpc } from '@/hooks/use-rpc'

const decode = getBase58Decoder()

/** The wallet refused the saved pass (Mobile Wallet Adapter error -1). Phantom then closes the session. */
export function isRefusedPass(e: unknown): boolean {
  const err = e as { code?: unknown; message?: string }
  if (err?.code === -1 || err?.code === 'ERROR_AUTHORIZATION_FAILED') return true
  return /^-1\/|authorization request failed|ERROR_AUTHORIZATION_FAILED/i.test(String(err?.message ?? e))
}

/**
 * Sends through the shop's wallet.
 * - Nothing touches the network while the wallet is on screen. Android 15 cuts a background app's network as soon as
 *   the wallet comes to the front (Kobo's firewall state read "blocked: APP_BACKGROUND"; the blockhash fetch inside the
 *   session died with "Unable to resolve host", mainnet refund 2026-10-11). So the blockhash is fetched at 'confirmed'
 *   just before the wallet opens, and a swap transaction is built before too. A transaction lives about 60 seconds from
 *   its blockhash; 'confirmed' (not the default 'finalized', which is ~13 s staler) leaves the whole minute for the
 *   approval, and a slower approval fails as 'expired' with copy that says so.
 * - If the wallet refuses the saved pass, the pass is dropped and the wallet is asked once for a fresh one, in a new
 *   session (Phantom closed the session on a refused pass, so the library's in-session retry never ran, 2026-10-06).
 * - `from`, when given, must be the wallet that signs; a different account is refused before anything is signed.
 * Returns the signature as a base58 string.
 */
export function useFreshSend() {
  const { chain, identity, store } = useMobileWallet()
  const rpc = useRpc()

  // Reads the saved pass at call time (not from a render), so a pass dropped a moment ago is really gone.
  const authorize = useCallback(
    async (wallet: KitMobileWallet): Promise<Address> => {
      const token = store.$authToken.get()
      const result = await wallet.authorize({ chain, identity, ...(token ? { auth_token: token } : {}) })
      const accounts = result.accounts.map((a) => {
        const address = getAddressCodec().decode(getBase64Encoder().encode(a.address))
        return { address, addressBase64: a.address, icon: a.icon, label: a.label ?? address }
      })
      const previous = store.$selectedAccount.get()
      const selectedAccount = previous && accounts.some((a) => a.addressBase64 === previous.addressBase64) ? previous : accounts[0]
      await store.persist({ accounts, authToken: result.auth_token, selectedAccount })
      return selectedAccount.address
    },
    [chain, identity, store],
  )

  const run = useCallback(
    async <T,>(from: Address | undefined, body: (wallet: KitMobileWallet, owner: Address) => Promise<T>): Promise<T> => {
      const once = () =>
        transact(async (wallet) => {
          const owner = await authorize(wallet)
          if (from && owner !== from) throw new Error(`a different wallet is connected (${owner}), expected ${from}`)
          return body(wallet, owner)
        })
      try {
        return await once()
      } catch (e) {
        if (!isRefusedPass(e) || !store.$authToken.get()) throw e
        const accounts = store.$accounts.get()
        const selectedAccount = store.$selectedAccount.get()
        const authToken = store.$authToken.get()
        await store.persist(null)
        try {
          return await once()
        } catch (again) {
          // Fresh connect declined or failed: keep the shop's address so the till still takes payments.
          if (!store.$authToken.get() && accounts && selectedAccount && authToken) await store.persist({ accounts, authToken, selectedAccount })
          throw again
        }
      }
    },
    [authorize, store],
  )

  /** Instructions signed by the shop's wallet as fee payer, with the lifetime already chosen. */
  const sendWith = useCallback(
    async (instructions: readonly Instruction[], from: Address | undefined, nonce: ShopNonce | null) => {
      const { context, value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()
      return run(from, async (wallet, owner) => {
        const message = pipe(
          createTransactionMessage({ version: 0 }),
          (m) => setTransactionMessageFeePayer(owner, m),
          (m) => withLifetime(m, blockhash, nonce),
          (m) => appendTransactionMessageInstructions(instructions, m),
        )
        const [sig] = await wallet.signAndSendTransactions({ minContextSlot: Number(context.slot), transactions: [message] })
        return decode.decode(sig)
      })
    },
    [run, rpc],
  )

  /** The shop's durable nonce, created on first use (one extra approval; the rent stays the shop's). */
  const shopNonce = useCallback(
    async (shop: Address): Promise<ShopNonce> => {
      const found = await readNonce(rpc, shop)
      if (found) return found
      const sig = await sendWith(await createNonceIxs(rpc, shop), shop, null)
      await waitConfirmed(rpc, sig, 'refund setup')
      const made = await readNonce(rpc, shop)
      if (!made) throw new Error('refund setup landed but the nonce account is missing')
      return made
    },
    [rpc, sendWith],
  )

  /** Instructions signed by the shop's wallet. With a known shop the approval cannot expire (durable nonce). */
  const sendInstructions = useCallback(
    async (instructions: readonly Instruction[], from?: Address) => sendWith(instructions, from, from ? await shopNonce(from) : null),
    [sendWith, shopNonce],
  )

  /**
   * A transaction built by someone else (a Jupiter swap), fetched before the wallet opens when the signer is known
   * (`from`), otherwise once the wallet has said who signs.
   */
  const sendBuilt = useCallback(
    async (build: (owner: Address) => Promise<Transaction>, from?: Address) => {
      const built = from ? await build(from) : undefined
      return run(from, async (wallet, owner) => {
        const tx = built ?? (await build(owner))
        const [sig] = await wallet.signAndSendTransactions({ transactions: [tx] })
        return decode.decode(sig)
      })
    },
    [run],
  )

  return { sendInstructions, sendBuilt }
}

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
  setTransactionMessageLifetimeUsingBlockhash,
  type Transaction,
} from '@solana/kit'
import { type KitMobileWallet, transact } from '@solana-mobile/mobile-wallet-adapter-protocol-kit'
import { useMobileWallet } from '@wallet-ui/react-native-kit'

const decode = getBase58Decoder()

/** The wallet refused the saved pass (Mobile Wallet Adapter error -1). Phantom then closes the session. */
export function isRefusedPass(e: unknown): boolean {
  const err = e as { code?: unknown; message?: string }
  if (err?.code === -1 || err?.code === 'ERROR_AUTHORIZATION_FAILED') return true
  return /^-1\/|authorization request failed|ERROR_AUTHORIZATION_FAILED/i.test(String(err?.message ?? e))
}

/**
 * Sends through the shop's wallet.
 * - The blockhash is fetched only after the wallet has opened and authorised the session, at 'confirmed'. A transaction
 *   lives about 60 seconds from its blockhash; fetched before the wallet opened, at the default 'finalized', the time
 *   spent unlocking and approving used it up ("Blockhash not found", devnet 2026-10-06).
 * - If the wallet refuses the saved pass, the pass is dropped and the wallet is asked once for a fresh one, in a new
 *   session (Phantom closed the session on a refused pass, so the library's in-session retry never ran, 2026-10-06).
 * - `from`, when given, must be the wallet that signs; a different account is refused before anything is signed.
 * Returns the signature as a base58 string.
 */
export function useFreshSend() {
  const { chain, client, identity, store } = useMobileWallet()

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

  /** Instructions signed by the shop's wallet as fee payer. */
  const sendInstructions = useCallback(
    (instructions: readonly Instruction[], from?: Address) =>
      run(from, async (wallet, owner) => {
        const { context, value: blockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()
        const message = pipe(
          createTransactionMessage({ version: 0 }),
          (m) => setTransactionMessageFeePayer(owner, m),
          (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
          (m) => appendTransactionMessageInstructions(instructions, m),
        )
        const [sig] = await wallet.signAndSendTransactions({ minContextSlot: Number(context.slot), transactions: [message] })
        return decode.decode(sig)
      }),
    [run, client],
  )

  /** A transaction built by someone else (a Jupiter swap), fetched once the wallet is ready. */
  const sendBuilt = useCallback(
    (build: (owner: Address) => Promise<Transaction>, from?: Address) =>
      run(from, async (wallet, owner) => {
        const tx = await build(owner)
        const [sig] = await wallet.signAndSendTransactions({ transactions: [tx] })
        return decode.decode(sig)
      }),
    [run],
  )

  return { sendInstructions, sendBuilt }
}

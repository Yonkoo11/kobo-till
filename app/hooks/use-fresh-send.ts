import { useCallback } from 'react'
import {
  type Address,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  getBase58Decoder,
  type Instruction,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Transaction,
} from '@solana/kit'
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-kit'
import { useAuthorization, useMobileWallet } from '@wallet-ui/react-native-kit'

/**
 * Sends through the shop's wallet with a blockhash fetched only after the wallet has opened and
 * authorised the session, at 'confirmed'. A transaction lives about 60 seconds from its blockhash;
 * fetched before the wallet opened, at the default 'finalized', the time spent unlocking and
 * approving used it up and the wallet's send failed with "Blockhash not found" (devnet, 2026-10-06).
 * Returns the signature as a base58 string.
 */
const decode = getBase58Decoder()

export function useFreshSend() {
  const mw = useMobileWallet()
  const { authorizeSession } = useAuthorization({ chain: mw.chain, identity: mw.identity, store: mw.store })
  /** Instructions signed by the shop's wallet as fee payer. */
  const sendInstructions = useCallback(
    (instructions: readonly Instruction[]) =>
      transact(async (wallet) => {
        const account = await authorizeSession(wallet)
        const { context, value: blockhash } = await mw.client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()
        const message = pipe(
          createTransactionMessage({ version: 0 }),
          (m) => setTransactionMessageFeePayer(account.address, m),
          (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
          (m) => appendTransactionMessageInstructions(instructions, m),
        )
        const [sig] = await wallet.signAndSendTransactions({ minContextSlot: Number(context.slot), transactions: [message] })
        return decode.decode(sig)
      }),
    [mw, authorizeSession],
  )

  /** A transaction built by someone else (a Jupiter swap), fetched once the wallet is ready. */
  const sendBuilt = useCallback(
    (build: (owner: Address) => Promise<Transaction>) =>
      transact(async (wallet) => {
        const account = await authorizeSession(wallet)
        const tx = await build(account.address)
        const [sig] = await wallet.signAndSendTransactions({ transactions: [tx] })
        return decode.decode(sig)
      }),
    [authorizeSession],
  )

  return { sendInstructions, sendBuilt }
}

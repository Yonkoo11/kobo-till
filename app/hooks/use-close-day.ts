import { address, Rpc, Signature, SolanaRpcApi } from '@solana/kit'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useCallback, useEffect, useState } from 'react'
import { SKR } from '@/core/constants'
import { quoteUsdcToSkr, swapTransaction } from '@/core/jupiter'
import { MAX_TRANSFERS_PER_TX, RewardLine, rewardKey, rewardLines, splitSkr } from '@/core/rewards'
import { hasSkrAccount } from '@/core/sgt'
import { transferIx } from '@/core/tokens'
import { useStore } from '@/state/store'
import { KoboData, SavedSwap } from '@/state/types'
import { useRpc } from './use-rpc'

export type CloseStep = 'idle' | 'quoting' | 'approving' | 'done' | 'error'
export interface CheckedLine extends RewardLine {
  hasSkr: boolean
}

const paidKeys = (d: KoboData) => new Set(Object.entries(d.rewardedByDay).flatMap(([day, ms]) => ms.map((m) => rewardKey(day, m))))

/** Every reward still owed (any day), each checked for the exact SKR account a transfer targets. */
export function useRewardLines() {
  const rpc = useRpc()
  const { data } = useStore()
  const [lines, setLines] = useState<CheckedLine[] | null>(null)
  useEffect(() => {
    const sales = data.sales.map((s) => ({ ...s, status: s.state, expected: BigInt(s.expected), received: s.received ? BigInt(s.received) : undefined }))
    const raw = rewardLines(sales, data.shop?.rewardPct ?? 0, paidKeys(data))
    Promise.all(raw.map(async (l) => ({ ...l, hasSkr: await hasSkrAccount(rpc, address(l.payer)).catch(() => false) }))).then(setLines)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpc])
  return lines
}

async function waitConfirmed(rpc: Rpc<SolanaRpcApi>, sig: string, timeoutMs = 45000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    const { value } = await rpc.getSignatureStatuses([sig as Signature]).send()
    const st = value[0]
    if (st?.err) throw new Error('swap failed on chain')
    if (st && (st.confirmationStatus === 'confirmed' || st.confirmationStatus === 'finalized')) return
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error('swap not confirmed in time')
}

const toSaved = (sig: string, minOut: bigint, lines: RewardLine[]): SavedSwap => ({
  sig,
  minOut: minOut.toString(),
  lines: lines.map((l) => ({ ...l, usd: l.usd.toString() })),
})

/**
 * Approval 1 swaps the reward total USDC -> SKR, and the swap is saved. Approval 2+ pays the lines,
 * at most 10 per transaction, each batch recorded as sent the moment it lands, so a retry after a
 * failure pays only who is still owed and never swaps again.
 */
export function useSendRewards(shop: string | null, shopName: string) {
  const rpc = useRpc()
  const { signAndSendTransactions, sendTransactions } = useMobileWallet()
  const { data, update } = useStore()
  const [step, setStep] = useState<CloseStep>('idle')
  const payLines = async (saved: SavedSwap) => {
    const parts = splitSkr(saved.lines.map((l) => ({ usd: BigInt(l.usd) })), BigInt(saved.minOut))
    const done = paidKeys(data)
    const todo = saved.lines.map((l, i) => ({ l, amount: parts[i] })).filter((x) => !done.has(x.l.key) && x.amount > 0n)
    for (let i = 0; i < todo.length; i += MAX_TRANSFERS_PER_TX) {
      const batch = todo.slice(i, i + MAX_TRANSFERS_PER_TX)
      const ix = []
      for (const { l, amount } of batch) {
        ix.push(...(await transferIx({ from: address(shop!), to: address(l.payer), mint: SKR.mint, decimals: SKR.decimals, amount, createTo: false })))
      }
      const { getAddMemoInstruction } = await import('@solana-program/memo')
      const sig = await sendTransactions([...ix, getAddMemoInstruction({ memo: `Kobo reward from ${shopName}` })])
      markSent(update, batch.map((b) => b.l), sig)
    }
  }
  const send = useCallback(
    async (eligible: CheckedLine[]) => {
      let saved = data.rewardSwap
      if (!saved) {
        const total = eligible.reduce((t, l) => t + l.usd, 0n)
        setStep('quoting')
        const quote = await quoteUsdcToSkr(total)
        setStep('approving')
        const tx = await swapTransaction(quote, address(shop!))
        const [swapSig] = (await signAndSendTransactions([tx], 0n)) as unknown as string[]
        await waitConfirmed(rpc, String(swapSig))
        saved = toSaved(String(swapSig), quote.minOut, eligible)
        const s = saved
        update((d) => ({ ...d, rewardSwap: s }))
      }
      setStep('approving')
      await payLines(saved)
      update((d) => ({ ...d, rewardSwap: null }))
      setStep('done')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rpc, shop, shopName, data.rewardSwap, signAndSendTransactions, sendTransactions, update],
  )
  return { step, setStep, send, resuming: !!data.rewardSwap }
}

function markSent(update: ReturnType<typeof useStore>['update'], lines: SavedSwap['lines'], sig: string) {
  const ids = new Set(lines.flatMap((l) => l.saleIds))
  update((d) => {
    const byDay = { ...d.rewardedByDay }
    for (const l of lines) byDay[l.day] = [...(byDay[l.day] ?? []), l.sgtMint]
    return { ...d, rewardedByDay: byDay, sales: d.sales.map((s) => (ids.has(s.id) ? { ...s, reward: 'sent', rewardSig: sig } : s)) }
  })
}

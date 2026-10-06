import { address } from '@solana/kit'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, Linking, View } from 'react-native'
import { COINS } from '@/core/constants'
import { findPriorRefund } from '@/core/refund-check'
import { transferIx } from '@/core/tokens'
import { useDollarBalance } from '@/hooks/use-balance'
import { solShortfall } from '@/core/fees'
import { useRpc } from '@/hooks/use-rpc'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { useStore } from '@/state/store'
import { refundAmount } from '@/state/refund'
import { copy } from '@/ui/copy'
import { coins, hhmm, naira, rateText, short, sol, solscan } from '@/ui/format'
import { Banner, Body, Button, Line, Meta, Screen, Slip, Title } from '@/ui/kit'

const REWARD_TEXT: Record<string, string> = {
  pending: copy.paidSeekerBadge,
  sent: copy.rewardSent,
  skipped: copy.rewardSkipped,
  'no-skr': copy.noSkrAccount,
  none: '',
}

export default function SaleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, patchSale } = useStore()
  const rpc = useRpc()
  const { sendTransactions } = useMobileWallet()
  const { address: shop, canSign } = useShopWallet()
  const sale = data.sales.find((s) => s.id === id)
  const balance = useDollarBalance(shop, sale?.coin)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; tone: 'danger' | 'info' } | null>(null)
  if (!sale) return <Screen><Body>…</Body></Screen>
  const refundable = ['paid', 'overpaid', 'underpaid'].includes(sale.state) && canSign && !!sale.payer
  const { amount, heldBack } = refundAmount(sale, data.shop?.rewardPct ?? 0)

  const doRefund = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const prior = await findPriorRefund(rpc, address(shop!), sale.payer!, COINS[sale.coin].mint, sale.paidAt ?? sale.createdAt)
      if (prior) {
        patchSale(sale.id, { state: 'refunded', refundSig: prior })
        return setMsg({ text: copy.refundAlready, tone: 'info' })
      }
      const missing = await solShortfall(rpc, address(shop!))
      if (missing > 0n) return setMsg({ text: copy.needSol(sol(missing)), tone: 'danger' })
      const ix = await transferIx({ from: address(shop!), to: address(sale.payer!), mint: COINS[sale.coin].mint, decimals: 6, amount, createTo: true })
      const sig = await sendTransactions(ix)
      patchSale(sale.id, { state: 'refunded', refundSig: sig, reward: sale.reward === 'pending' ? 'none' : sale.reward })
      setMsg({ text: copy.refundDone(coins(amount), sale.coin, short(sale.payer)), tone: 'info' })
    } catch {
      const low = balance.data !== undefined && balance.data < amount
      setMsg({ text: low ? copy.refundLowBalance(sale.coin, coins(amount)) : copy.refundFailed, tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }
  const confirmRefund = () =>
    Alert.alert(copy.refund, copy.refundConfirm(coins(amount), sale.coin, sale.payer!), [
      { text: copy.cancel, style: 'cancel' },
      { text: copy.refund, style: 'destructive', onPress: doRefund },
    ])

  return (
    <Screen>
      <Slip>
        <Title>₦{naira(sale.naira)}</Title>
        <View>
          {sale.items?.length ? <Line label={copy.receiptItems} value={sale.items.map((n) => `₦${naira(n)}`).join(' + ')} /> : null}
          <Line label={copy.receiptCoin} value={`${coins(sale.received ?? sale.expected)} ${sale.coin}`} />
          <Line label={copy.receiptRate} value={`₦${rateText(sale.rate)} per $1`} />
          <Line label={copy.receiptTime} value={hhmm(sale.createdAt)} />
          <Line label={copy.receiptFrom} value={`${short(sale.payer)}${sale.sgtMint ? ' · Seeker' : ''}`} last={!REWARD_TEXT[sale.reward]} />
          {REWARD_TEXT[sale.reward] ? <Line label={copy.receiptReward} value={REWARD_TEXT[sale.reward]} last /> : null}
        </View>
        {sale.signature ? <Button title={copy.viewOnSolscan} kind="link" onPress={() => Linking.openURL(solscan(sale.signature!)).catch(() => undefined)} /> : null}
      </Slip>
      {refundable && heldBack > 0n ? <Meta>{copy.refundHeldBack(coins(heldBack), sale.coin)}</Meta> : null}
      {msg ? <Banner text={msg.text} tone={msg.tone} /> : null}
      {refundable ? <Button title={busy ? copy.refundOpening : copy.refund} kind="secondary" busy={busy} onPress={confirmRefund} /> : null}
    </Screen>
  )
}

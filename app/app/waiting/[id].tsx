import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Linking, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { TIMING } from '@/constants/app-config'
import { useLastCheck, useOnline } from '@/hooks/online'
import { useNow } from '@/hooks/use-now'
import { createSale, newReference, saleUrl } from '@/core/sale'
import { lagosDay } from '@/core/rewards'
import { useStore } from '@/state/store'
import { toSale } from '@/state/convert'
import { StoredSale } from '@/state/types'
import { copy } from '@/ui/copy'
import { randomBytes } from '@/utils/random'
import { coins, dateText, hhmm, hhmmss, naira, rateText, short, solscan } from '@/ui/format'
import { Banner, Body, Button, ChainCheck, Line, Meta, Print, Screen, Slip, Title } from '@/ui/kit'
import { t } from '@/ui/theme'

export default function Waiting() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, patchSale } = useStore()
  const sale = data.sales.find((s) => s.id === id)
  const was = useRef(sale?.state)
  useEffect(() => {
    if (was.current === 'waiting' && sale && sale.state !== 'waiting' && sale.state !== 'cancelled') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined)
    }
    was.current = sale?.state
  }, [sale?.state, sale])
  if (!sale) return <Screen><Body>…</Body></Screen>
  if (sale.state === 'waiting') return <WaitingView sale={sale} onCancel={() => { patchSale(sale.id, { state: 'cancelled' }); router.back() }} twins={data.sales.filter((o) => o.state === 'waiting' && o.id !== sale.id && o.coin === sale.coin && o.expected === sale.expected).length > 0} />
  if (sale.state === 'cancelled' || sale.state === 'refunded' || !sale.received) return null // leaving the screen
  if (sale.state === 'underpaid') return <UnderpaidView sale={sale} />
  return <PaidView sale={sale} />
}

function WaitingView({ sale, onCancel, twins }: { sale: StoredSale; onCancel: () => void; twins: boolean }) {
  const { width } = useWindowDimensions()
  const size = Math.min(width - 64, 320)
  const online = useOnline()
  const checkedAt = useLastCheck()
  const now = useNow(5000)
  const long = now - sale.createdAt > TIMING.stillWaitingMs
  return (
    <Screen>
      <Slip style={{ alignItems: 'center' }}>
        <Meta>{sale.label}</Meta>
        <View style={s.qr}>
          <QRCode value={saleUrl(toSale(sale))} size={size - 32} quietZone={0} />
        </View>
        <Text style={s.amountLine}>₦{naira(sale.naira)} · {coins(sale.expected)} {sale.coin}</Text>
        <Meta>{copy.rateLocked(rateText(sale.rate), hhmm(sale.createdAt))}</Meta>
        <Meta>{copy.waitingScanHint}</Meta>
      </Slip>
      <View style={{ gap: t.space(1) }}>
        <Body>{copy.waitingLine}</Body>
        {checkedAt ? <ChainCheck at={checkedAt} text={copy.chainChecked(hhmmss(checkedAt))} /> : null}
      </View>
      {!online ? <Banner text={copy.waitingOffline} /> : null}
      {long ? <Banner text={copy.waitingLong(hhmm(sale.createdAt))} tone="info" /> : null}
      {twins ? <Banner text={copy.sameAmountNote} tone="info" /> : null}
      <View style={{ flex: 1 }} />
      <Button title={copy.cancel} kind="secondary" onPress={onCancel} />
    </Screen>
  )
}

function PaidView({ sale }: { sale: StoredSale }) {
  const { data } = useStore()
  const share = () =>
    Share.share({
      message: copy.receiptText(data.shop?.name ?? sale.label, coins(sale.received!), sale.coin, naira(sale.naira), hhmm(sale.paidAt!), dateText(sale.paidAt!), solscan(sale.signature!)),
    }).catch(() => undefined)
  return (
    <Screen>
      <Print>
        <Slip>
          <Text style={s.tick} accessibilityElementsHidden>✓</Text>
          <Title>{copy.paidTitle(naira(sale.naira))}</Title>
          {sale.matchedBy === 'amount' ? <Meta>{copy.paidByAmountNote}</Meta> : null}
          <View>
            <Line label={copy.receiptReceived} value={`${coins(sale.received!)} ${sale.coin}`} />
            {sale.state === 'overpaid' ? <Line label="" value={`+${coins(BigInt(sale.received!) - BigInt(sale.expected))} ${sale.coin}`} /> : null}
            <Line label={copy.receiptFrom} value={short(sale.payer)} />
            <Line label={copy.receiptTime} value={hhmm(sale.paidAt!)} />
            <Line label={copy.receiptRate} value={`₦${rateText(sale.rate)} per $1`} last />
          </View>
          {sale.sgtMint ? <Text style={s.badge}>{copy.paidSeekerBadge}</Text> : null}
          {sale.signature ? <Button title={copy.viewOnSolscan} kind="link" onPress={() => Linking.openURL(solscan(sale.signature!)).catch(() => undefined)} /> : null}
        </Slip>
      </Print>
      <View style={{ flex: 1 }} />
      <Button title={copy.shareReceipt} kind="secondary" onPress={share} />
      <Button title={copy.newSale} onPress={() => router.replace('/(tabs)')} />
    </Screen>
  )
}

function UnderpaidView({ sale }: { sale: StoredSale }) {
  const { update, patchSale } = useStore()
  const shortCoins = BigInt(sale.expected) - BigInt(sale.received!)
  const shortNaira = (Number(shortCoins) / 1e6) * sale.rate
  const chargeRest = () => {
    const rest = createSale({ naira: shortNaira, rate: sale.rate, coin: sale.coin, recipient: sale.recipient as never, reference: newReference(randomBytes), label: sale.label })
    const stored: StoredSale = { ...rest, expected: rest.expected.toString(), recipient: sale.recipient, day: lagosDay(rest.createdAt), state: 'waiting', reward: 'none', parentId: sale.id }
    update((d) => ({ ...d, sales: [stored, ...d.sales] }))
    router.replace(`/waiting/${stored.id}`)
  }
  return (
    <Screen>
      <Slip>
        <Title style={{ color: t.warn }}>{copy.underpaidTitle(naira(shortNaira))}</Title>
        <Meta>{copy.underpaidBody(coins(sale.received!), coins(sale.expected), sale.coin)}</Meta>
        <View>
          <Line label={copy.receiptReceived} value={`${coins(sale.received!)} ${sale.coin}`} />
          <Line label={copy.receiptExpected} value={`${coins(sale.expected)} ${sale.coin}`} last />
        </View>
      </Slip>
      <View style={{ flex: 1 }} />
      <Button title={copy.chargeRest} onPress={chargeRest} />
      <Button title={copy.acceptAsIs} kind="secondary" onPress={() => { patchSale(sale.id, { state: 'paid' }); router.replace('/(tabs)') }} />
    </Screen>
  )
}

const s = StyleSheet.create({
  qr: { padding: t.space(4), backgroundColor: t.slip },
  amountLine: { ...t.size.coin, fontFamily: t.font.medium, color: t.ink1, fontVariant: ['tabular-nums'] },
  tick: { ...t.size.amount, fontFamily: t.font.medium, color: t.accent },
  badge: { ...t.size.meta, fontFamily: t.font.semibold, color: t.ink1, backgroundColor: t.accentSoft, borderRadius: t.radius.chip, paddingHorizontal: t.space(3), paddingVertical: t.space(1), alignSelf: 'flex-start', overflow: 'hidden' },
})

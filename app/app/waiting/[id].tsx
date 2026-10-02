import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { TIMING } from '@/constants/app-config'
import { useOnline } from '@/hooks/online'
import { useNow } from '@/hooks/use-now'
import { createSale, newReference, saleUrl } from '@/core/sale'
import { lagosDay } from '@/core/rewards'
import { useStore } from '@/state/store'
import { toSale } from '@/state/convert'
import { StoredSale } from '@/state/types'
import { copy } from '@/ui/copy'
import { randomBytes } from '@/utils/random'
import { coins, dateText, hhmm, naira, short, solscan } from '@/ui/format'
import { Banner, Body, Button, Screen, Title } from '@/ui/kit'
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
  if (sale.state === 'underpaid') return <UnderpaidView sale={sale} />
  return <PaidView sale={sale} />
}

function WaitingView({ sale, onCancel, twins }: { sale: StoredSale; onCancel: () => void; twins: boolean }) {
  const { width } = useWindowDimensions()
  const size = Math.min(width - 32, 360)
  const online = useOnline()
  const now = useNow(5000)
  const long = now - sale.createdAt > TIMING.stillWaitingMs
  return (
    <Screen style={{ alignItems: 'center' }}>
      <Title>{sale.label}</Title>
      <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: t.radius }}>
        <QRCode value={saleUrl(toSale(sale))} size={size - 32} quietZone={0} />
      </View>
      <Text style={s.amountLine}>₦{naira(sale.naira)} · {coins(sale.expected)} {sale.coin}</Text>
      <Body muted>{copy.waitingScanHint}</Body>
      <Body>● {copy.waitingLine}</Body>
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
    <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 96, color: t.accent }}>✓</Text>
      <Title style={{ fontSize: 36 }}>{copy.paidTitle(naira(sale.naira))}</Title>
      <Body>{copy.paidFrom(coins(sale.received!), sale.coin, short(sale.payer))}</Body>
      {sale.state === 'overpaid' ? <Body muted>+{coins(BigInt(sale.received!) - BigInt(sale.expected))} {sale.coin}</Body> : null}
      {sale.matchedBy === 'amount' ? <Body muted>{copy.paidByAmountNote}</Body> : null}
      {sale.sgtMint ? <Banner text={copy.paidSeekerBadge} tone="info" /> : null}
      <View style={{ height: t.space(2) }} />
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
    <Screen style={{ justifyContent: 'center' }}>
      <Title style={{ color: t.warn }}>{copy.underpaidTitle(naira(shortNaira))}</Title>
      <Body>{copy.underpaidBody(coins(sale.received!), coins(sale.expected), sale.coin)}</Body>
      <Button title={copy.chargeRest} onPress={chargeRest} />
      <Button title={copy.acceptAsIs} kind="secondary" onPress={() => { patchSale(sale.id, { state: 'paid' }); router.replace('/(tabs)') }} />
    </Screen>
  )
}

const s = StyleSheet.create({
  amountLine: { fontSize: t.font.coin, fontWeight: '700', color: t.ink, fontVariant: ['tabular-nums'] },
})

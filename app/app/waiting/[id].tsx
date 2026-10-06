import { createAudioPlayer } from 'expo-audio'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Linking, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import * as ExpoPrint from 'expo-print'
import QRCode from 'react-native-qrcode-svg'
import { IS_TEST_BUILD, TIMING } from '@/constants/app-config'
import { useLastCheck, useOnline } from '@/hooks/online'
import { useNow } from '@/hooks/use-now'
import { createSale, newReference, saleUrl } from '@/core/sale'
import { lagosDay } from '@/core/rewards'
import { LINK_LIFETIME_MS, shareLink } from '@/core/share'
import { useStore } from '@/state/store'
import { toSale } from '@/state/convert'
import { StoredSale } from '@/state/types'
import { copy } from '@/ui/copy'
import { receiptHtml } from '@/ui/receipt-html'
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
      if (sale.state === 'paid' || sale.state === 'overpaid') playPaidChime()
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
  const { patchSale } = useStore()
  const { width } = useWindowDimensions()
  const size = Math.min(width - 64, 320)
  const online = useOnline()
  const checkedAt = useLastCheck()
  const now = useNow(5000)
  const long = now - sale.createdAt > TIMING.stillWaitingMs
  return (
    <Screen>
      <Slip contentStyle={{ alignItems: 'center' }}>
        <Meta>{sale.label}</Meta>
        <View style={s.qr}>
          <QRCode value={saleUrl(toSale(sale))} size={size - 32} quietZone={0} />
        </View>
        <Text style={s.amountLine}>₦{naira(sale.naira)} · {coins(sale.expected)} {sale.coin}</Text>
        <Meta>{copy.rateLocked(rateText(sale.rate), hhmm(sale.createdAt))}</Meta>
        <Meta>{copy.waitingScanHint}</Meta>
        {BigInt(sale.expected) % 10000n !== 0n ? <Meta>{copy.uniqueAmountNote}</Meta> : null}
      </Slip>
      <View style={{ gap: t.space(1) }}>
        <Body>{copy.waitingLine}</Body>
        {checkedAt ? <ChainCheck at={checkedAt} text={copy.chainChecked(hhmmss(checkedAt))} /> : null}
      </View>
      {!online ? <Banner text={copy.waitingOffline} /> : null}
      {long ? <Banner text={copy.waitingLong(hhmm(sale.createdAt))} tone="info" /> : null}
      {sale.linkUntil ? <Meta>{now > sale.linkUntil ? copy.linkExpired(hhmm(sale.linkUntil)) : copy.linkValid(hhmm(sale.linkUntil))}</Meta> : null}
      {twins ? <Banner text={copy.sameAmountNote} tone="info" /> : null}
      <View style={{ flex: 1 }} />
      {!IS_TEST_BUILD ? <Button title={copy.sharePayLink} kind="secondary" onPress={() => sharePayLink(sale, patchSale)} /> : null}
      <Button title={copy.cancel} kind="link" onPress={onCancel} />
    </Screen>
  )
}

// For a customer who is not at the counter (WhatsApp, Instagram): a web link to the pay page, which opens their wallet.
function sharePayLink(sale: StoredSale, patchSale: (id: string, p: Partial<StoredSale>) => void) {
  const until = Date.now() + LINK_LIFETIME_MS
  patchSale(sale.id, { linkUntil: until })
  const link = shareLink(toSale(sale), until)
  Share.share({ message: copy.payLinkText(sale.label, naira(sale.naira), coins(sale.expected), sale.coin, hhmm(sale.createdAt), link) }).catch(() => undefined)
}

// Android's print dialog: pick a printer, or Save as PDF.
async function printReceipt(sale: StoredSale, shop: string) {
  try {
    await ExpoPrint.printAsync({ html: await receiptHtml(sale, shop) })
  } catch {
    // dialog cancelled or no print service
  }
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
            {sale.items?.length ? <Line label={copy.receiptItems} value={sale.items.map((n) => `₦${naira(n)}`).join(' + ')} /> : null}
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
      <View style={{ flexDirection: 'row', gap: t.space(2) }}>
        <Button title={copy.shareReceipt} kind="secondary" onPress={share} style={{ flex: 1 }} />
        <Button title={copy.printReceipt} kind="secondary" onPress={() => void printReceipt(sale, data.shop?.name ?? sale.label)} style={{ flex: 1 }} />
      </View>
      <Button title={copy.newSale} onPress={() => router.replace('/(tabs)')} />
    </Screen>
  )
}

function UnderpaidView({ sale }: { sale: StoredSale }) {
  const { data, update, patchSale } = useStore()
  const shortCoins = BigInt(sale.expected) - BigInt(sale.received!)
  const shortNaira = (Number(shortCoins) / 1e6) * sale.rate
  const chargeRest = () => {
    const owed = data.sales.filter((o) => o.state === 'waiting' && o.coin === sale.coin).map((o) => BigInt(o.expected))
    const rest = createSale({ naira: shortNaira, rate: sale.rate, coin: sale.coin, recipient: sale.recipient as never, reference: newReference(randomBytes), label: sale.label }, Date.now(), owed)
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

// A two-note till chime (app/assets/sounds/paid.wav, made with ffmpeg sine tones). Sound is a nicety:
// a phone that cannot play it still shows Paid and buzzes.
function playPaidChime() {
  try {
    const player = createAudioPlayer(require('@/assets/sounds/paid.wav'))
    player.play()
    setTimeout(() => player.remove(), 2000)
  } catch {
    // no audio on this device; the receipt and the haptic still fire
  }
}

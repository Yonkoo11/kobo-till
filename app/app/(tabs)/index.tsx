import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { IS_TEST_BUILD } from '@/constants/app-config'
import { CoinId } from '@/core/constants'
import { createSale, newReference } from '@/core/sale'
import { lagosDay } from '@/core/rewards'
import { useRate } from '@/hooks/use-rate'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { useStore } from '@/state/store'
import { StoredSale } from '@/state/types'
import { copy } from '@/ui/copy'
import { randomBytes } from '@/utils/random'
import { coins, hhmm, naira, rateText } from '@/ui/format'
import { Banner, Button, Meta, Screen, Slip } from '@/ui/kit'
import { t } from '@/ui/theme'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫']

export default function Till() {
  const { data, update } = useStore()
  const { address, canSign } = useShopWallet()
  const { view, setManual } = useRate()
  const accepted = (['USDC', 'USDT'] as CoinId[]).filter((c) => data.shop?.accept[c])
  const [coin, setCoin] = useState<CoinId>(accepted[0] ?? 'USDC')
  const [amount, setAmount] = useState('')
  const [items, setItems] = useState<number[]>([]) // prices already added with + Item
  const [typedRate, setTypedRate] = useState('')
  const typed = Number(amount || '0')
  const value = items.reduce((a, b) => a + b, 0) + typed
  const rate = view.kind === 'live' || view.kind === 'offline' || view.kind === 'manual' ? view.value : null
  const preview = rate && value > 0 ? createPreview(value, rate, coin) : null

  const press = (k: string) => {
    if (k === '⌫' && !amount && items.length) return setItems((x) => x.slice(0, -1)) // empty keypad: drop the last item
    setAmount((a) => (k === '⌫' ? a.slice(0, -1) : (a + k).replace(/^0+/, '').slice(0, 9)))
  }
  const addItem = () => {
    if (typed <= 0) return
    setItems((x) => [...x, typed])
    setAmount('')
  }

  const charge = () => {
    if (!rate || !address || value <= 0) return
    const owed = data.sales.filter((o) => o.state === 'waiting' && o.coin === coin).map((o) => BigInt(o.expected))
    const sale = createSale({ naira: value, rate, coin, recipient: address as never, reference: newReference(randomBytes), label: data.shop!.name }, Date.now(), owed)
    const stored: StoredSale = {
      ...sale,
      recipient: address,
      reference: sale.reference,
      expected: sale.expected.toString(),
      day: lagosDay(sale.createdAt),
      state: 'waiting',
      reward: 'none',
      ...(items.length ? { items: typed > 0 ? [...items, typed] : items } : {}),
    }
    update((d) => ({ ...d, sales: [stored, ...d.sales] }))
    setAmount('')
    setItems([])
    router.push(`/waiting/${stored.id}`)
  }

  return (
    <Screen tab>
      {IS_TEST_BUILD ? <Banner text={copy.testBanner} tone="danger" /> : null}
      {!canSign ? <Banner text={copy.viewOnlyBanner} tone="info" /> : null}
      <Slip>
        <Meta>{data.shop?.name}</Meta>
        <Text style={s.amount} adjustsFontSizeToFit numberOfLines={1}>₦{naira(value)}</Text>
        {items.length ? (
          <Text style={s.items} numberOfLines={2} accessibilityLabel={copy.itemsLabel(items.length + (typed > 0 ? 1 : 0))}>
            {[...items, ...(typed > 0 ? [typed] : [])].map((n) => `₦${naira(n)}`).join(' + ')}
          </Text>
        ) : null}
        <Text style={s.coin}>{preview ? `≈ ${preview} ${coin}` : ' '}</Text>
        <RateLine view={view} onManual={setManual} typed={typedRate} setTyped={setTypedRate} />
      </Slip>
      {accepted.length > 1 ? (
        <View style={s.coinRow}>
          {accepted.map((c) => (
            <Pressable key={c} onPress={() => setCoin(c)} style={[s.coinChip, c === coin && s.coinChipOn]} accessibilityRole="button">
              <Text style={[s.coinChipText, c === coin && { color: t.slip }]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={s.pad}>
        {KEYS.map((k) => (
          <Pressable key={k} onPress={() => press(k)} style={({ pressed }) => [s.key, pressed && s.keyOn]} accessibilityRole="button" accessibilityLabel={k === '⌫' ? 'Delete' : k}>
            <Text style={s.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.actions}>
        <Button title={copy.addItem} kind="secondary" onPress={addItem} disabled={typed <= 0} style={s.addBtn} />
        <Button title={copy.charge} onPress={charge} disabled={!rate || value <= 0 || !address} style={s.chargeBtn} />
      </View>
    </Screen>
  )
}

function createPreview(nairaAmount: number, rate: number, coin: CoinId): string {
  return coins(createSale({ naira: nairaAmount, rate, coin, recipient: '11111111111111111111111111111111' as never, reference: '11111111111111111111111111111111' as never, label: '' }).expected)
}

function RateLine(p: { view: ReturnType<typeof useRate>['view']; onManual: (v: number | null) => void; typed: string; setTyped: (s: string) => void }) {
  const v = p.view
  if (v.kind === 'loading') return <Text style={s.rate}>{copy.tillRateLoading}</Text>
  if (v.kind === 'manual-needed' || v.kind === 'manual') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space(1) }}>
        <Text style={s.rate}>{copy.tillRateManual}</Text>
        <TextInput
          keyboardType="numeric"
          value={v.kind === 'manual' && !p.typed ? String(Math.round(v.value)) : p.typed}
          onChangeText={(x) => {
            p.setTyped(x)
            const n = Number(x)
            p.onManual(n > 100 ? n : null)
          }}
          style={s.rateInput}
        />
      </View>
    )
  }
  if (v.disagree)
    return (
      <Pressable onPress={() => p.onManual(Math.round(v.value))}>
        <Text style={[s.rate, { color: t.warn }]}>{copy.tillRateDisagree(rateText(v.value))}</Text>
      </Pressable>
    )
  const line = v.kind === 'offline' ? copy.tillRateOffline(hhmm(v.at)) : copy.tillRateLine(rateText(v.value), hhmm(v.at))
  return <Text style={s.rate}>{line}</Text>
}

const s = StyleSheet.create({
  amount: { ...t.size.amount, fontFamily: t.font.medium, color: t.ink1, fontVariant: ['tabular-nums'] },
  items: { ...t.size.meta, fontFamily: t.font.regular, color: t.ink2, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: t.space(2) },
  addBtn: { flex: 1 },
  chargeBtn: { flex: 2 },
  coin: { ...t.size.coin, fontFamily: t.font.medium, color: t.ink1, fontVariant: ['tabular-nums'] },
  rate: { ...t.size.meta, fontFamily: t.font.regular, color: t.ink2 },
  rateInput: { ...t.size.body, fontFamily: t.font.regular, color: t.ink1, borderBottomWidth: 1, borderColor: t.rule, minWidth: 72, paddingVertical: t.space(1) },
  coinRow: { flexDirection: 'row', gap: t.space(2), justifyContent: 'center' },
  coinChip: { minHeight: 44, paddingHorizontal: t.space(4), borderRadius: t.radius.chip, borderWidth: 1, borderColor: t.rule, justifyContent: 'center', backgroundColor: t.slip },
  coinChipOn: { backgroundColor: t.ink1, borderColor: t.ink1 },
  coinChipText: { ...t.size.body, fontFamily: t.font.semibold, color: t.ink1 },
  pad: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'stretch' },
  key: { width: '33.33%', height: '25%', alignItems: 'center', justifyContent: 'center', minHeight: t.tap, borderRadius: t.radius.control },
  keyOn: { backgroundColor: t.accentSoft },
  keyText: { ...t.size.title, fontFamily: t.font.regular, color: t.ink1, fontVariant: ['tabular-nums'] },
})

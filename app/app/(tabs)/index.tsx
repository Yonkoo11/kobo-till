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
import { Banner, Button, Screen } from '@/ui/kit'
import { t } from '@/ui/theme'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫']

export default function Till() {
  const { data, update } = useStore()
  const { address, canSign } = useShopWallet()
  const { view, setManual } = useRate()
  const accepted = (['USDC', 'USDT'] as CoinId[]).filter((c) => data.shop?.accept[c])
  const [coin, setCoin] = useState<CoinId>(accepted[0] ?? 'USDC')
  const [amount, setAmount] = useState('')
  const [typedRate, setTypedRate] = useState('')
  const value = Number(amount || '0')
  const rate = view.kind === 'live' || view.kind === 'offline' || view.kind === 'manual' ? view.value : null
  const preview = rate && value > 0 ? createPreview(value, rate, coin) : null

  const press = (k: string) =>
    setAmount((a) => (k === '⌫' ? a.slice(0, -1) : (a + k).replace(/^0+/, '').slice(0, 9)))

  const charge = () => {
    if (!rate || !address || value <= 0) return
    const sale = createSale({ naira: value, rate, coin, recipient: address as never, reference: newReference(randomBytes), label: data.shop!.name })
    const stored: StoredSale = {
      ...sale,
      recipient: address,
      reference: sale.reference,
      expected: sale.expected.toString(),
      day: lagosDay(sale.createdAt),
      state: 'waiting',
      reward: 'none',
    }
    update((d) => ({ ...d, sales: [stored, ...d.sales] }))
    setAmount('')
    router.push(`/waiting/${stored.id}`)
  }

  return (
    <Screen>
      {IS_TEST_BUILD ? <Banner text={copy.testBanner} tone="danger" /> : null}
      {!canSign ? <Banner text={copy.viewOnlyBanner} tone="info" /> : null}
      <View style={s.display}>
        <Text style={s.amount} adjustsFontSizeToFit numberOfLines={1}>₦{naira(value)}</Text>
        <Text style={s.coin}>{preview ? `≈ ${preview} ${coin}` : ' '}</Text>
        <RateLine view={view} onManual={setManual} typed={typedRate} setTyped={setTypedRate} />
      </View>
      {accepted.length > 1 ? (
        <View style={s.coinRow}>
          {accepted.map((c) => (
            <Pressable key={c} onPress={() => setCoin(c)} style={[s.coinChip, c === coin && s.coinChipOn]} accessibilityRole="button">
              <Text style={[s.coinChipText, c === coin && { color: t.accentInk }]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={s.pad}>
        {KEYS.map((k) => (
          <Pressable key={k} onPress={() => press(k)} style={({ pressed }) => [s.key, pressed && { backgroundColor: t.line }]} accessibilityRole="button" accessibilityLabel={k === '⌫' ? 'Delete' : k}>
            <Text style={s.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>
      <Button title={copy.charge} onPress={charge} disabled={!rate || value <= 0 || !address} />
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
          style={{ borderBottomWidth: 1, borderColor: t.line, minWidth: 72, fontSize: t.font.body }}
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
  display: { alignItems: 'center', paddingVertical: t.space(2), gap: t.space(0.5) },
  amount: { fontSize: t.font.amount, fontWeight: '700', color: t.ink, fontVariant: ['tabular-nums'] },
  coin: { fontSize: t.font.coin, color: t.ink, fontVariant: ['tabular-nums'] },
  rate: { fontSize: t.font.small, color: t.muted },
  coinRow: { flexDirection: 'row', gap: t.space(1), justifyContent: 'center' },
  coinChip: { minHeight: 40, paddingHorizontal: t.space(2), borderRadius: 20, borderWidth: 1, borderColor: t.line, justifyContent: 'center', backgroundColor: t.surface },
  coinChipOn: { backgroundColor: t.accent, borderColor: t.accent },
  coinChipText: { fontSize: t.font.body, fontWeight: '600', color: t.ink },
  pad: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'stretch' },
  key: { width: '33.33%', height: '25%', alignItems: 'center', justifyContent: 'center', minHeight: t.tap },
  keyText: { fontSize: 28, fontWeight: '500', color: t.ink },
})

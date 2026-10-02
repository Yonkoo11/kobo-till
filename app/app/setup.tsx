import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { useStore } from '@/state/store'
import { Shop } from '@/state/types'
import { copy } from '@/ui/copy'
import { Body, Button, Screen, Title } from '@/ui/kit'
import { t } from '@/ui/theme'

const DEFAULT: Shop = { name: '', accept: { USDC: true, USDT: true }, rewardPct: 2, adjustPct: 0 }

export default function Setup() {
  const { data, update } = useStore()
  const [shop, setShop] = useState<Shop>(data.shop ?? DEFAULT)
  const [touched, setTouched] = useState(false)
  const nameOk = shop.name.trim().length >= 2 && shop.name.trim().length <= 40
  const coinsOk = shop.accept.USDC || shop.accept.USDT

  const save = () => {
    setTouched(true)
    if (!nameOk || !coinsOk) return
    update((d) => ({ ...d, shop: { ...shop, name: shop.name.trim() } }))
    router.replace('/(tabs)')
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: t.space(2) }}>
        <Title>{copy.setupTitle}</Title>
        <Body>{copy.shopNameLabel}</Body>
        <TextInput
          value={shop.name}
          onChangeText={(name) => setShop({ ...shop, name })}
          placeholder={copy.shopNamePlaceholder}
          maxLength={40}
          style={{ borderWidth: 1, borderColor: t.line, borderRadius: t.radius, padding: t.space(1.5), fontSize: t.font.body, backgroundColor: t.surface }}
        />
        {touched && !nameOk ? <Body style={{ color: t.danger }}>{copy.shopNameError}</Body> : null}
        <Body>{copy.acceptLabel}</Body>
        {(['USDC', 'USDT'] as const).map((c) => (
          <View key={c} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: t.tap }}>
            <Body>{c}</Body>
            <Switch value={shop.accept[c]} onValueChange={(v) => setShop({ ...shop, accept: { ...shop.accept, [c]: v } })} />
          </View>
        ))}
        {!coinsOk ? <Body style={{ color: t.danger }}>{copy.coinsOffError}</Body> : null}
        <Stepper label={copy.rewardLabel} value={shop.rewardPct} min={0} max={5} onChange={(rewardPct) => setShop({ ...shop, rewardPct })} />
        <Body muted>{copy.rewardHelp}</Body>
        <Stepper label={copy.rateAdjustLabel} value={shop.adjustPct} min={-5} max={5} signed onChange={(adjustPct) => setShop({ ...shop, adjustPct })} />
        <Button title={copy.save} onPress={save} disabled={!coinsOk} />
      </ScrollView>
    </Screen>
  )
}

function Stepper(p: { label: string; value: number; min: number; max: number; signed?: boolean; onChange: (v: number) => void }) {
  const step = (d: number) => p.onChange(Math.min(p.max, Math.max(p.min, Math.round((p.value + d) * 2) / 2)))
  const shown = `${p.signed && p.value > 0 ? '+' : ''}${p.value}%`
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Body style={{ flex: 1 }}>{p.label}</Body>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space(1) }}>
        <Round label="−" onPress={() => step(-0.5)} />
        <Text style={{ fontSize: t.font.body, width: 56, textAlign: 'center', fontVariant: ['tabular-nums'] }}>{shown}</Text>
        <Round label="+" onPress={() => step(0.5)} />
      </View>
    </View>
  )
}

function Round({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ width: t.tap, height: t.tap, borderRadius: t.tap / 2, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface }}>
      <Text style={{ fontSize: 22 }}>{label}</Text>
    </Pressable>
  )
}

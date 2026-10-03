import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { useStore } from '@/state/store'
import { Shop } from '@/state/types'
import { copy } from '@/ui/copy'
import { Body, Button, Meta, Screen, Slip, Title } from '@/ui/kit'
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
      <ScrollView contentContainerStyle={{ gap: t.space(4) }}>
        <Title>{copy.setupTitle}</Title>
        <Slip>
          <Text style={[s.header, !shop.name.trim() && { color: t.ink3 }]} numberOfLines={1}>{shop.name.trim() || copy.shopNamePlaceholder}</Text>
        </Slip>
        <Meta>{copy.shopNameLabel}</Meta>
        <TextInput
          value={shop.name}
          onChangeText={(name) => setShop({ ...shop, name })}
          placeholder={copy.shopNamePlaceholder}
          placeholderTextColor={t.ink3}
          maxLength={40}
          style={s.input}
        />
        {touched && !nameOk ? <Body style={{ color: t.danger }}>{copy.shopNameError}</Body> : null}
        <Meta>{copy.acceptLabel}</Meta>
        {(['USDC', 'USDT'] as const).map((c) => (
          <View key={c} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: t.tap }}>
            <Body>{c}</Body>
            <Switch trackColor={{ true: t.accent, false: t.rule }} thumbColor={t.slip} value={shop.accept[c]} onValueChange={(v) => setShop({ ...shop, accept: { ...shop.accept, [c]: v } })} />
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space(2) }}>
        <Round label="−" onPress={() => step(-0.5)} />
        <Text style={s.stepValue}>{shown}</Text>
        <Round label="+" onPress={() => step(0.5)} />
      </View>
    </View>
  )
}

function Round({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={s.round}>
      <Text style={s.roundText}>{label}</Text>
    </Pressable>
  )
}

const s = StyleSheet.create({
  header: { ...t.size.coin, fontFamily: t.font.medium, color: t.ink1, textAlign: 'center' },
  input: { ...t.size.body, fontFamily: t.font.regular, color: t.ink1, borderWidth: 1, borderColor: t.rule, borderRadius: t.radius.control, padding: t.space(3), backgroundColor: t.slip },
  stepValue: { ...t.size.body, fontFamily: t.font.medium, color: t.ink1, width: 56, textAlign: 'center', fontVariant: ['tabular-nums'] },
  round: { width: t.tap, height: t.tap, borderRadius: t.radius.chip, borderWidth: 1, borderColor: t.rule, alignItems: 'center', justifyContent: 'center', backgroundColor: t.slip },
  roundText: { ...t.size.coin, fontFamily: t.font.medium, color: t.ink1 },
})

import { isAddress } from '@solana/kit'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useStore } from '@/state/store'
import { copy } from '@/ui/copy'
import { Banner, Body, Button, Line, Meta, Screen, Slip, Title } from '@/ui/kit'
import { t } from '@/ui/theme'

export default function Welcome() {
  const { connect } = useMobileWallet()
  const { data, update } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewOnly, setViewOnly] = useState(false)
  const [typed, setTyped] = useState('')

  const onConnect = async () => {
    setBusy(true)
    setError(null)
    try {
      try {
        await withTimeout(connect(), 30000)
      } catch (first) {
        // Seen on a real phone 2026-10-05: a wallet that is still starting answers "cancelled" once.
        if (!/cancel/i.test(String(first))) throw first
        await new Promise((r) => setTimeout(r, 1500))
        await withTimeout(connect(), 30000)
      }
      router.replace(data.shop ? '/(tabs)' : '/setup')
    } catch (e) {
      setError(/no.*wallet|not found|ActivityNotFound/i.test(String(e)) ? copy.noWallet : copy.connectError)
    } finally {
      setBusy(false)
    }
  }
  const onViewOnly = () => {
    update((d) => ({ ...d, viewOnly: typed.trim() }))
    router.replace(data.shop ? '/(tabs)' : '/setup')
  }

  return (
    <Screen>
      <Text style={s.name}>{copy.appName}</Text>
      <Title>{copy.welcomeTitle}</Title>
      <Body muted>{copy.welcomeBody}</Body>
      <Slip style={s.example}>
        <Meta>{copy.example}</Meta>
        <Title>{copy.paidTitle('2,000')}</Title>
        <Line label={copy.receiptReceived} value="1.51 USDC" last />
      </Slip>
      <View style={{ flex: 1 }} />
      {error ? <Banner text={error} tone="danger" /> : null}
      <Button title={busy ? copy.connecting : copy.connect} onPress={onConnect} busy={busy} />
      {!viewOnly ? (
        <Button title={copy.viewOnly} kind="link" onPress={() => setViewOnly(true)} />
      ) : (
        <View style={{ gap: t.space(2) }}>
          <Banner text={copy.viewOnlyStaff} tone="info" />
          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={copy.addressPlaceholder}
            placeholderTextColor={t.ink3}
            style={s.input}
          />
          <Button title={copy.save} kind="secondary" onPress={onViewOnly} disabled={!isAddress(typed.trim())} />
        </View>
      )}
    </Screen>
  )
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
}

const s = StyleSheet.create({
  name: { ...t.size.amount, fontFamily: t.font.medium, color: t.ink1 },
  example: { transform: [{ scale: 0.9 }] },
  input: { ...t.size.body, fontFamily: t.font.regular, color: t.ink1, borderWidth: 1, borderColor: t.rule, borderRadius: t.radius.control, padding: t.space(3), backgroundColor: t.slip },
})

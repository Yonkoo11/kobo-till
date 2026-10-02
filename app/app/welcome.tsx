import { isAddress } from '@solana/kit'
import { router } from 'expo-router'
import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useStore } from '@/state/store'
import { copy } from '@/ui/copy'
import { Banner, Body, Button, Screen, Title } from '@/ui/kit'
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
      await withTimeout(connect(), 30000)
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
    <Screen style={{ justifyContent: 'center' }}>
      <Title style={{ fontSize: 40 }}>{copy.appName}</Title>
      <Title>{copy.welcomeTitle}</Title>
      <Body muted>{copy.welcomeBody}</Body>
      {error ? <Banner text={error} tone="danger" /> : null}
      <Button title={busy ? copy.connecting : copy.connect} onPress={onConnect} busy={busy} />
      {!viewOnly ? (
        <Button title={copy.viewOnly} kind="link" onPress={() => setViewOnly(true)} />
      ) : (
        <View style={{ gap: t.space(1) }}>
          <Banner text={copy.viewOnlyBanner} tone="info" />
          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={copy.addressPlaceholder}
            style={{ borderWidth: 1, borderColor: t.line, borderRadius: t.radius, padding: t.space(1.5), fontSize: t.font.body, backgroundColor: t.surface }}
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

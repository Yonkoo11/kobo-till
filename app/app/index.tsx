import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { ActivityIndicator, View } from 'react-native'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { useStore } from '@/state/store'

export default function Start() {
  const { ready, data } = useStore()
  const { address } = useShopWallet()
  // The wallet link is read from storage after start-up. Deciding before it has loaded sent a connected shop to the
  // welcome screen (seen after an app update, 2026-10-06).
  const { store } = useMobileWallet()
  const [walletLoaded, setWalletLoaded] = useState(false)
  useEffect(() => {
    store.fetch().catch(() => null).finally(() => setWalletLoaded(true))
  }, [store])
  if (!ready || !walletLoaded)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  if (!address) return <Redirect href="/welcome" />
  if (!data.shop) return <Redirect href="/setup" />
  return <Redirect href="/(tabs)" />
}

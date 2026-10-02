import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { useStore } from '@/state/store'

export default function Start() {
  const { ready, data } = useStore()
  const { address } = useShopWallet()
  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  if (!address) return <Redirect href="/welcome" />
  if (!data.shop) return <Redirect href="/setup" />
  return <Redirect href="/(tabs)" />
}

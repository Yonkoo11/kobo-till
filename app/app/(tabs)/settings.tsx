import { router } from 'expo-router'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { Alert } from 'react-native'
import { USING_PUBLIC_RPC } from '@/constants/app-config'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { useStore } from '@/state/store'
import { copy } from '@/ui/copy'
import { short } from '@/ui/format'
import { Button, Meta, Screen, Slip, Title } from '@/ui/kit'

export default function Settings() {
  const { disconnect } = useMobileWallet()
  const { data, update } = useStore()
  const { address, canSign } = useShopWallet()
  const onDisconnect = () =>
    Alert.alert('', copy.disconnectConfirm, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.disconnect,
        style: 'destructive',
        onPress: async () => {
          if (canSign) await disconnect().catch(() => undefined)
          update((d) => ({ ...d, viewOnly: null }))
          router.replace('/welcome')
        },
      },
    ])
  return (
    <Screen tab>
      <Slip>
        <Title>{data.shop?.name}</Title>
        <Meta>{short(address ?? '')}</Meta>
        <Meta>{USING_PUBLIC_RPC ? copy.networkPublic : copy.networkFast}</Meta>
      </Slip>
      <Button title={copy.setupTitle} kind="secondary" onPress={() => router.push('/setup')} />
      <Button title={copy.shopQrTitle} kind="secondary" onPress={() => router.push('/shop-qr')} />
      <Button title={copy.cashout} kind="secondary" onPress={() => router.push('/cashout')} />
      <Button title={copy.disconnect} kind="danger" onPress={onDisconnect} />
    </Screen>
  )
}

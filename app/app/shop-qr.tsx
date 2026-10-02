import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useRef, useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { useStore } from '@/state/store'
import { copy } from '@/ui/copy'
import { Banner, Body, Button, Screen, Title } from '@/ui/kit'

/** Static Solana Pay QR (recipient + label, no amount) for printing at the counter. */
export default function ShopQr() {
  const { data } = useStore()
  const { address } = useShopWallet()
  const { width } = useWindowDimensions()
  const ref = useRef<{ toDataURL: (cb: (b64: string) => void) => void } | null>(null)
  const [error, setError] = useState(false)
  const url = `solana:${address}?label=${encodeURIComponent(data.shop?.name ?? 'Kobo')}`
  const save = () => {
    setError(false)
    ref.current?.toDataURL(async (b64) => {
      try {
        const file = new File(Paths.cache, 'kobo-shop-qr.png')
        file.write(b64, { encoding: 'base64' })
        await Sharing.shareAsync(file.uri, { mimeType: 'image/png' })
      } catch {
        setError(true)
      }
    })
  }
  return (
    <Screen style={{ alignItems: 'center' }}>
      <Title>{copy.shopQrTitle}</Title>
      <Body muted>{data.shop?.name}</Body>
      <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 12 }}>
        <QRCode value={url} size={Math.min(width - 64, 320)} getRef={(r) => (ref.current = r as never)} />
      </View>
      {error ? <Banner text={copy.saveFailed} tone="danger" /> : null}
      <Button title={copy.saveImage} onPress={save} />
    </Screen>
  )
}

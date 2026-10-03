import Clipboard from '@react-native-clipboard/clipboard'
import { Linking } from 'react-native'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { copy } from '@/ui/copy'
import { Body, Button, Meta, Screen } from '@/ui/kit'

// Kobo never converts: these open licensed exchanges (SEC approval-in-principle, Aug 2024, FACTS F-027).
// Play listings verified 2026-10-02: "Busha: Make your money better!" and "Quidax - Buy Bitcoin & Crypto".
// The Play page shows "Open" when the app is installed, so no app-link scheme is guessed.
const EXCHANGES = [
  { title: copy.cashoutBusha, url: 'https://play.google.com/store/apps/details?id=co.busha.android' },
  { title: copy.cashoutQuidax, url: 'https://play.google.com/store/apps/details?id=io.quidax.app' },
]

export default function Cashout() {
  const { address } = useShopWallet()
  return (
    <Screen>
      <Body>{copy.cashoutBody}</Body>
      {EXCHANGES.map((e) => (
        <Button key={e.title} title={e.title} kind="secondary" onPress={() => Linking.openURL(e.url).catch(() => undefined)} />
      ))}
      <Meta selectable>{address}</Meta>
      <Button title={copy.copyAddress} kind="link" onPress={() => address && Clipboard.setString(address)} />
    </Screen>
  )
}

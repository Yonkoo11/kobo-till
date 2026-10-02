import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useStore } from '@/state/store'

/** The address sales are paid to: the connected wallet, else the view-only address. */
export function useShopWallet() {
  const { account } = useMobileWallet()
  const { data } = useStore()
  const address = account?.address ?? data.viewOnly ?? null
  return { address: address as string | null, canSign: !!account }
}

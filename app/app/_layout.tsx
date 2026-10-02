import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { AppProviders } from '@/components/app-providers'
import { SaleWatcher } from '@/hooks/sale-watcher'
import { StoreProvider } from '@/state/store'
import { t } from '@/ui/theme'

export default function RootLayout() {
  return (
    <AppProviders>
      <StoreProvider>
        <SaleWatcher />
        <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: t.bg }, contentStyle: { backgroundColor: t.bg } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="setup" options={{ title: '' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="waiting/[id]" options={{ title: '', gestureEnabled: false }} />
          <Stack.Screen name="sale/[id]" options={{ title: '' }} />
          <Stack.Screen name="close" options={{ title: '' }} />
          <Stack.Screen name="shop-qr" options={{ title: '' }} />
          <Stack.Screen name="cashout" options={{ title: '' }} />
        </Stack>
        <StatusBar style="dark" />
      </StoreProvider>
    </AppProviders>
  )
}

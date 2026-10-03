import { FamiljenGrotesk_400Regular, FamiljenGrotesk_500Medium, FamiljenGrotesk_600SemiBold, useFonts } from '@expo-google-fonts/familjen-grotesk'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { AppProviders } from '@/components/app-providers'
import { SaleWatcher } from '@/hooks/sale-watcher'
import { StoreProvider } from '@/state/store'
import { t } from '@/ui/theme'

export default function RootLayout() {
  const [fontsReady] = useFonts({ FamiljenGrotesk_400Regular, FamiljenGrotesk_500Medium, FamiljenGrotesk_600SemiBold })
  if (!fontsReady) return null
  return (
    <AppProviders>
      <StoreProvider>
        <SaleWatcher />
        <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: t.ground }, headerTintColor: t.ink1, contentStyle: { backgroundColor: t.ground } }}>
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

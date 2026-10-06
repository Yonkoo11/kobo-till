import { FamiljenGrotesk_400Regular, FamiljenGrotesk_500Medium, FamiljenGrotesk_600SemiBold, useFonts } from '@expo-google-fonts/familjen-grotesk'
import * as Notifications from 'expo-notifications'
import { router, Stack } from 'expo-router'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { AppProviders } from '@/components/app-providers'
import { startBackgroundCheck } from '@/hooks/background-check' // defines the background task at start-up
import { SaleWatcher } from '@/hooks/sale-watcher'
import { StoreProvider } from '@/state/store'
import { t } from '@/ui/theme'

export default function RootLayout() {
  const [fontsReady] = useFonts({ FamiljenGrotesk_400Regular, FamiljenGrotesk_500Medium, FamiljenGrotesk_600SemiBold })
  useEffect(() => {
    void startBackgroundCheck()
    // Tapping a Paid notification opens that sale's receipt.
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const id = r.notification.request.content.data?.saleId
      if (typeof id === 'string') router.push(`/waiting/${id}`)
    })
    return () => sub.remove()
  }, [])
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

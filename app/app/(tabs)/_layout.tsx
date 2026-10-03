import { Tabs } from 'expo-router'
import { t } from '@/ui/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.ink2,
        tabBarStyle: { backgroundColor: t.slip, borderTopColor: t.rule, height: 64 },
        tabBarLabelStyle: { ...t.size.meta, fontFamily: t.font.semibold },
        sceneStyle: { backgroundColor: t.ground },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Till' }} />
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}

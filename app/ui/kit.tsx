import { PropsWithChildren } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { t } from './theme'

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <View style={[s.inner, style]}>{children}</View>
    </SafeAreaView>
  )
}

export function Title(p: TextProps) {
  return <Text {...p} style={[s.title, p.style]} />
}
export function Body(p: TextProps & { muted?: boolean }) {
  return <Text {...p} style={[s.body, p.muted && { color: t.muted }, p.style]} />
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  busy,
}: {
  title: string
  onPress: () => void
  kind?: 'primary' | 'secondary' | 'link'
  disabled?: boolean
  busy?: boolean
}) {
  const off = disabled || busy
  return (
    <Pressable
      accessibilityRole="button"
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [s.btn, s[kind], off && s.off, pressed && !off && s.pressed]}
    >
      {busy ? <ActivityIndicator color={kind === 'primary' ? t.accentInk : t.accent} /> : null}
      <Text style={[s.btnText, kind !== 'primary' && { color: t.accent }]}>{title}</Text>
    </Pressable>
  )
}

export function Banner({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'danger' | 'info' }) {
  const color = tone === 'danger' ? t.danger : tone === 'info' ? t.muted : t.warn
  return (
    <View style={[s.banner, { borderColor: color }]}>
      <Text style={[s.small, { color }]}>{text}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.bg },
  inner: { flex: 1, padding: t.space(2), gap: t.space(2) },
  title: { fontSize: t.font.title, fontWeight: '700', color: t.ink },
  body: { fontSize: t.font.body, color: t.ink, lineHeight: 22 },
  small: { fontSize: t.font.small },
  btn: {
    minHeight: t.tap,
    borderRadius: t.radius,
    paddingHorizontal: t.space(2),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: t.space(1),
  },
  primary: { backgroundColor: t.accent },
  secondary: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line },
  link: { backgroundColor: 'transparent' },
  off: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  btnText: { fontSize: t.font.body, fontWeight: '600', color: t.accentInk },
  banner: { borderLeftWidth: 4, backgroundColor: t.warnBg, padding: t.space(1.5), borderRadius: 6 },
})

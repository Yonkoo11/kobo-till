import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, ActivityIndicator, Animated, Pressable, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
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
  return <Text {...p} style={[s.body, p.muted && { color: t.ink2 }, p.style]} />
}
export function Meta(p: TextProps) {
  return <Text {...p} style={[s.meta, p.style]} />
}

/** The signature device: a strip of till paper with a torn zigzag bottom edge. Only money moments use it. */
export function Slip({ children, style, contentStyle }: PropsWithChildren<{ style?: ViewStyle; contentStyle?: ViewStyle }>) {
  const [w, setW] = useState(0)
  return (
    <View style={[s.slipWrap, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={[s.slip, contentStyle]}>{children}</View>
      {w > 0 ? <Zigzag width={w} /> : null}
    </View>
  )
}

function Zigzag({ width }: { width: number }) {
  const { tooth, depth } = t.zigzag
  const n = Math.ceil(width / tooth)
  let d = `M0 0 H${width} V0`
  for (let i = n; i > 0; i--) d += ` L${Math.min(width, (i - 0.5) * tooth)} ${depth} L${(i - 1) * tooth} 0`
  return (
    <Svg width={width} height={depth} style={{ marginTop: -0.5 }}>
      <Path d={`${d} Z`} fill={t.slip} />
    </Svg>
  )
}

/** One receipt row: label left, value right, dashed rule under it. */
export function Line({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.line, !last && s.lineRule]}>
      <Text style={s.meta}>{label}</Text>
      <Text style={s.lineValue}>{value}</Text>
    </View>
  )
}

export function useReducedMotion(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setOn).catch(() => undefined)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn)
    return () => sub.remove()
  }, [])
  return on
}

/** The one entrance: the Paid receipt prints down once. A cut when reduced motion is on. */
export function Print({ children }: PropsWithChildren) {
  const reduced = useReducedMotion()
  const p = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(p, { toValue: 1, duration: reduced ? 0 : t.motion.printMs, easing: t.motion.ease, useNativeDriver: true }).start()
  }, [p, reduced])
  const translateY = p.interpolate({ inputRange: [0, 1], outputRange: [t.motion.printFrom, 0] })
  return <Animated.View style={{ opacity: p, transform: [{ translateY }] }}>{children}</Animated.View>
}

/** chain-check: the dot lights on each real Solana check; the time is always written beside it. */
export function ChainCheck({ at, text }: { at: number; text: string }) {
  const reduced = useReducedMotion()
  const v = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (reduced || !at) return
    v.setValue(1)
    Animated.timing(v, { toValue: 0, duration: t.motion.checkMs, easing: t.motion.ease, useNativeDriver: false }).start()
  }, [at, v, reduced])
  const bg = reduced ? t.accent : v.interpolate({ inputRange: [0, 1], outputRange: [t.ink3, t.accent] })
  return (
    <View style={s.check}>
      <Animated.View style={[s.dot, { backgroundColor: bg }]} />
      <Text style={s.meta}>{text}</Text>
    </View>
  )
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
  kind?: 'primary' | 'secondary' | 'link' | 'danger'
  disabled?: boolean
  busy?: boolean
}) {
  const off = disabled || busy
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [s.btn, s[kind], off && s.off, pressed && !off && s.pressed]}
    >
      {busy ? <ActivityIndicator color={kind === 'primary' ? t.accentInk : t.accent} /> : null}
      <Text style={[s.btnText, kind === 'secondary' && { color: t.ink1 }, kind === 'link' && { color: t.accent }, kind === 'danger' && { color: t.danger }]}>{title}</Text>
    </Pressable>
  )
}

export function Banner({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'danger' | 'info' }) {
  const bg = tone === 'danger' ? t.dangerSoft : tone === 'info' ? t.accentSoft : t.warnSoft
  const color = tone === 'danger' ? t.danger : tone === 'info' ? t.ink1 : t.warn
  return (
    <View style={[s.banner, { backgroundColor: bg }]} accessibilityRole="alert">
      <Text style={[s.meta, { color }]}>{text}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.ground },
  inner: { flex: 1, padding: t.space(4), gap: t.space(4) },
  title: { ...t.size.title, fontFamily: t.font.medium, color: t.ink1 },
  body: { ...t.size.body, fontFamily: t.font.regular, color: t.ink1 },
  meta: { ...t.size.meta, fontFamily: t.font.regular, color: t.ink2 },
  slipWrap: { alignSelf: 'stretch' },
  slip: {
    backgroundColor: t.slip,
    borderTopLeftRadius: t.radius.slip,
    borderTopRightRadius: t.radius.slip,
    paddingHorizontal: t.space(4),
    paddingTop: t.space(4),
    paddingBottom: t.space(6),
    gap: t.space(2),
    ...t.shadowSlip,
  },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: t.space(2), gap: t.space(4) },
  lineRule: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: t.rule },
  lineValue: { ...t.size.coin, fontFamily: t.font.medium, color: t.ink1, fontVariant: ['tabular-nums'], flexShrink: 1, textAlign: 'right' },
  check: { flexDirection: 'row', alignItems: 'center', gap: t.space(2) },
  dot: { width: 8, height: 8, borderRadius: 4 },
  btn: {
    minHeight: t.tap,
    borderRadius: t.radius.control,
    paddingHorizontal: t.space(4),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: t.space(2),
    alignSelf: 'stretch',
  },
  primary: { backgroundColor: t.accent },
  secondary: { backgroundColor: t.slip, borderWidth: 1, borderColor: t.rule },
  link: { backgroundColor: 'transparent', minHeight: 48 },
  danger: { backgroundColor: 'transparent', minHeight: 48 },
  off: { opacity: 0.4 },
  pressed: { opacity: 0.86 },
  btnText: { ...t.size.body, fontFamily: t.font.semibold, color: t.accentInk },
  banner: { borderRadius: t.radius.control, padding: t.space(3), alignSelf: 'stretch' },
})

import { router } from 'expo-router'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { lagosDay } from '@/core/rewards'
import { useDollarBalance } from '@/hooks/use-balance'
import { useNow } from '@/hooks/use-now'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { useStore } from '@/state/store'
import { StoredSale } from '@/state/types'
import { copy } from '@/ui/copy'
import { coins, hhmm, naira, short, usd } from '@/ui/format'
import { Body, Button, Screen, Title } from '@/ui/kit'
import { t } from '@/ui/theme'

const PAIDISH = ['paid', 'overpaid', 'underpaid']
const LABEL: Record<string, string> = { paid: 'Paid', overpaid: 'Paid', underpaid: 'Underpaid', waiting: 'Waiting', refunded: 'Refunded' }

export default function Today() {
  const { data } = useStore()
  const { address } = useShopWallet()
  const balance = useDollarBalance(address)
  const today = lagosDay(useNow(60000))
  const sales = data.sales.filter((s) => s.day === today && s.state !== 'cancelled')
  const paid = sales.filter((s) => PAIDISH.includes(s.state))
  const nairaTotal = paid.reduce((n, s) => n + s.naira, 0)
  const usdTotal = paid.reduce((n, s) => n + BigInt(s.received ?? '0'), 0n)

  return (
    <Screen>
      <Title>{copy.todayTotals(naira(nairaTotal), usd(usdTotal))}</Title>
      <Body muted>{balance.isError ? copy.balanceOffline : balance.data !== undefined ? copy.yourDollars(usd(balance.data)) : '…'}</Body>
      <FlatList
        data={sales}
        keyExtractor={(s) => s.id}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.line }} />}
        ListEmptyComponent={<Body muted style={{ paddingVertical: t.space(4) }}>{copy.todayEmpty}</Body>}
        renderItem={({ item }) => <Row sale={item} />}
      />
      <Button title={copy.closeDay} onPress={() => router.push('/close')} disabled={paid.length === 0} />
    </Screen>
  )
}

function Row({ sale }: { sale: StoredSale }) {
  const go = () => router.push(sale.state === 'waiting' ? `/waiting/${sale.id}` : `/sale/${sale.id}`)
  return (
    <Pressable onPress={go} style={s.row} accessibilityRole="button">
      <Text style={s.time}>{hhmm(sale.createdAt)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.main}>₦{naira(sale.naira)} · {coins(sale.received ?? sale.expected)} {sale.coin}</Text>
        <Text style={s.sub}>
          {LABEL[sale.state]}
          {sale.payer ? ` · ${short(sale.payer)}` : ''}
          {sale.sgtMint ? ' · Seeker' : ''}
        </Text>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: t.space(2), paddingVertical: t.space(1.5), minHeight: t.tap, alignItems: 'center' },
  time: { fontSize: t.font.small, color: t.muted, width: 48, fontVariant: ['tabular-nums'] },
  main: { fontSize: t.font.body, color: t.ink, fontWeight: '600', fontVariant: ['tabular-nums'] },
  sub: { fontSize: t.font.small, color: t.muted },
})

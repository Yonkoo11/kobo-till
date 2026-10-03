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
import { Body, Button, Meta, Screen, Slip, Title } from '@/ui/kit'
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

  const owed = new Set(sales.filter((x) => x.reward === 'pending').map((x) => x.sgtMint)).size
  return (
    <Screen>
      <Slip>
        <Title>{copy.todayTotals(naira(nairaTotal), usd(usdTotal))}</Title>
        <Meta>{balance.isError ? copy.balanceOffline : balance.data !== undefined ? copy.yourDollars(usd(balance.data)) : '…'}</Meta>
        {owed > 0 ? <Meta>{copy.todayRewardsOwed(owed)}</Meta> : null}
      </Slip>
      {sales.length === 0 ? (
        <Body muted>{copy.todayEmpty}</Body>
      ) : (
        <Slip style={{ flexShrink: 1 }}>
          <FlatList
            data={sales}
            keyExtractor={(x) => x.id}
            ItemSeparatorComponent={() => <View style={s.rule} />}
            renderItem={({ item }) => <Row sale={item} />}
          />
        </Slip>
      )}
      <View style={{ flex: 1 }} />
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
  row: { flexDirection: 'row', gap: t.space(4), paddingVertical: t.space(3), minHeight: t.tap, alignItems: 'center' },
  rule: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: t.rule },
  time: { ...t.size.meta, fontFamily: t.font.regular, color: t.ink2, width: 48, fontVariant: ['tabular-nums'] },
  main: { ...t.size.coin, fontFamily: t.font.medium, color: t.ink1, fontVariant: ['tabular-nums'] },
  sub: { ...t.size.meta, fontFamily: t.font.regular, color: t.ink2 },
})

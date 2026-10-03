import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useCloseDayData } from '@/hooks/use-close-day-data'
import { useSendRewards } from '@/hooks/use-close-day'
import { quoteUsdcToSkr } from '@/core/jupiter'
import { useDollarBalance } from '@/hooks/use-balance'
import { useNow } from '@/hooks/use-now'
import { useShopWallet } from '@/hooks/use-shop-wallet'
import { useStore } from '@/state/store'
import { copy } from '@/ui/copy'
import { coins, naira, short, usd } from '@/ui/format'
import { Banner, Body, Button, Line, Meta, Screen, Slip, Title } from '@/ui/kit'
import { t } from '@/ui/theme'

export default function Close() {
  const { data, update } = useStore()
  const { address: shop, canSign } = useShopWallet()
  const usdc = useDollarBalance(shop, 'USDC')
  const c = useCloseDayData(useNow(60000))
  const { step, setStep, send, resuming } = useSendRewards(shop, data.shop?.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [skrPreview, setSkrPreview] = useState<string | null>(null)

  const eligible = (c.lines ?? []).filter((l) => l.hasSkr)
  const total = eligible.reduce((n, l) => n + l.usd, 0n)
  useEffect(() => {
    if (total === 0n) return
    quoteUsdcToSkr(total)
      .then((q) => setSkrPreview(coins(q.outAmount).split('.')[0]))
      .catch(() => setSkrPreview('?'))
  }, [total])
  const finish = () => {
    update((d) => ({ ...d, closedDays: [...new Set([...d.closedDays, c.day])] }))
    router.back()
  }
  const skip = () => {
    update((d) => ({
      ...d,
      sales: d.sales.map((s) => (s.day === c.day && s.reward === 'pending' ? { ...s, reward: 'skipped' } : s)),
    }))
    finish()
  }
  const onSend = async () => {
    setError(null)
    if (!resuming && usdc.data !== undefined && usdc.data < total) return setError(copy.rewardsLowUsdc(usd(total)))
    try {
      await send(eligible)
    } catch (e) {
      setStep('error')
      setError(String(e).includes('quote') ? copy.quoteFailed : copy.rewardsFailed)
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: t.space(4) }}>
        <Slip>
          <Title>{copy.closeSummary(c.count, naira(c.nairaTotal))}</Title>
          {c.lines === null ? <Meta>…</Meta> : null}
          {c.lines && c.lines.length === 0 ? <Body>{copy.closeNone}</Body> : null}
          {eligible.length > 0 ? <Meta>{copy.closeRewards(eligible.length, String(data.shop?.rewardPct ?? 0), usd(total), skrPreview ?? '…')}</Meta> : null}
          <View>
            {(c.lines ?? []).map((l, i, all) => (
              <View key={l.key} style={{ opacity: l.hasSkr ? 1 : 0.4 }}>
                <Line
                  label={short(l.payer)}
                  value={`$${usd(l.usd)}${l.hasSkr ? (step === 'done' ? ` · ${copy.sent}` : '') : ` · ${copy.noSkrAccount}`}`}
                  last={i === all.length - 1}
                />
              </View>
            ))}
          </View>
        </Slip>
        {step === 'quoting' ? <Meta>{copy.quoteLoading}</Meta> : null}
        {step === 'approving' ? <Meta>{copy.approveLoading}</Meta> : null}
        {error ? <Banner text={error} tone="danger" /> : null}
      </ScrollView>
      {eligible.length > 0 && step !== 'done' ? (
        <>
          <Button title={copy.sendRewards} onPress={onSend} busy={step === 'quoting' || step === 'approving'} disabled={!canSign} />
          <Button title={copy.skipRewards} kind="link" onPress={skip} />
        </>
      ) : (
        <Button title={copy.done} onPress={finish} />
      )}
    </Screen>
  )
}

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createSolanaRpc } from '@solana/kit'
import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import { MAINNET_RPC, TEST_RPC } from '@/constants/app-config'
import { livePatchSale, STORE_KEY } from '@/state/store'
import { EMPTY, KoboData } from '@/state/types'
import { checkSale } from './check-sale'
import { sendPaidAlert } from './paid-alert'

export const PAID_CHECK_TASK = 'kobo-paid-check'
const LOOKBACK_MS = 24 * 60 * 60 * 1000 // only sales from the last day
const MAX_PER_RUN = 5

// Android runs this about every 15 minutes at best, when the system allows. It catches a payment that landed while
// Kobo was closed and posts a notification; the till shows the same result the next time it opens.
TaskManager.defineTask(PAID_CHECK_TASK, async () => {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY)
    if (!raw) return BackgroundTask.BackgroundTaskResult.Success
    let data: KoboData = { ...EMPTY, ...JSON.parse(raw) }
    const rpc = createSolanaRpc(TEST_RPC || MAINNET_RPC)
    const open = data.sales
      .filter((s) => s.state === 'waiting' && Date.now() - s.createdAt < LOOKBACK_MS)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_PER_RUN)
    for (const s of open) {
      const patch = await checkSale(rpc, s, data)
      if (!patch) continue
      data = { ...data, sales: data.sales.map((o) => (o.id === s.id ? { ...o, ...patch } : o)) }
      if (livePatchSale) livePatchSale(s.id, patch)
      else await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data))
      await sendPaidAlert(s, patch)
    }
    return BackgroundTask.BackgroundTaskResult.Success
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed
  }
})

export async function startBackgroundCheck(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync()
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return
    if (!(await TaskManager.isTaskRegisteredAsync(PAID_CHECK_TASK))) {
      await BackgroundTask.registerTaskAsync(PAID_CHECK_TASK, { minimumInterval: 15 })
    }
  } catch {
    // background work unavailable; payments still confirm when Kobo is open
  }
}

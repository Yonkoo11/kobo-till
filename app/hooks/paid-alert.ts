import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { StoredSale } from '@/state/types'
import { copy } from '@/ui/copy'
import { coins, naira, short } from '@/ui/format'

const CHANNEL = 'payments'

// A payment that lands while Kobo is open already shows on screen with a buzz and a chime; no banner then.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }),
})

/** Ask once, at the first sale, so the shop can hear about payments that land while Kobo is closed. */
export async function askForPaidAlerts(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, { name: copy.alertChannel, importance: Notifications.AndroidImportance.HIGH })
    }
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') await Notifications.requestPermissionsAsync()
  } catch {
    // no notifications on this phone; the till still shows Paid when opened
  }
}

/** A local notification for a sale that settled while Kobo was not on screen. Tapping it opens the sale. */
export async function sendPaidAlert(sale: StoredSale, patch: Partial<StoredSale>): Promise<void> {
  try {
    const received = patch.received ? coins(patch.received) : coins(sale.expected)
    await Notifications.scheduleNotificationAsync({
      identifier: `paid-${sale.id}`, // one notification per sale: a repeat check replaces it instead of stacking
      content: {
        title: patch.state === 'underpaid' ? copy.alertUnderpaid(naira(sale.naira)) : copy.alertPaid(naira(sale.naira)),
        body: copy.alertBody(received, sale.coin, short(patch.payer), sale.label),
        data: { saleId: sale.id },
      },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL } : null,
    })
  } catch {
    // ignore: the sale is saved either way
  }
}

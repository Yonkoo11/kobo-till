import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Which identity address the saved wallet pass was issued under. A wallet ties a pass to the identity it first saw,
 * verifies that address when asked to sign, and goes silent when the check fails; so a pass from another address is
 * not reused, a fresh connect gets a new one.
 */
const KEY = 'kobo.pass-identity'

export async function passIdentity(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY)
  } catch {
    return null
  }
}

export async function rememberPassIdentity(uri: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, uri)
  } catch {
    // storage unavailable: the next connect simply starts fresh
  }
}

/** Fill `b` with secure random bytes (react-native-quick-crypto installs crypto.getRandomValues). */
export function randomBytes(b: Uint8Array): Uint8Array {
  crypto.getRandomValues(b as Uint8Array<ArrayBuffer>)
  return b
}

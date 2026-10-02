export function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`)
  const v = i > -1 ? process.argv[i + 1] : fallback
  if (v === undefined) throw new Error(`missing --${name}`)
  return v
}
export const RPC_URL = process.env.KOBO_RPC_URL || 'https://api.mainnet-beta.solana.com'

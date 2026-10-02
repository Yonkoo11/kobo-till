import { formatCoins } from '@/core/sale'

export const naira = (n: number) => Math.round(n).toLocaleString('en-NG')
export const rateText = (r: number) => Math.round(r).toLocaleString('en-NG')
export const coins = (base: string | bigint) => formatCoins(BigInt(base))
export const usd = (base: bigint) => (Number(base) / 1e6).toFixed(2)

/** HH:MM on the Lagos clock (UTC+1). */
export function hhmm(ms: number): string {
  return new Date(ms + 3600_000).toISOString().slice(11, 16)
}
export function dateText(ms: number): string {
  return new Date(ms + 3600_000).toISOString().slice(0, 10)
}
export function short(addr?: string): string {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : ''
}
export function solscan(sig: string, devnet = false): string {
  return `https://solscan.io/tx/${sig}${devnet ? '?cluster=devnet' : ''}`
}

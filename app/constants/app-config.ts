import { AppIdentity, createSolanaDevnet, createSolanaLocalnet, createSolanaMainnet, SolanaCluster } from '@wallet-ui/react-native-kit'
import { PUBLIC_RPC } from '@/core/constants'

// A Helius (or other) URL goes in app/.env as EXPO_PUBLIC_KOBO_RPC_URL; never commit it.
// Test builds point at a local validator (EXPO_PUBLIC_KOBO_TEST_RPC) and show a "not real money" banner.
export const TEST_RPC = process.env.EXPO_PUBLIC_KOBO_TEST_RPC
export const IS_TEST_BUILD = !!TEST_RPC
export const MAINNET_RPC = process.env.EXPO_PUBLIC_KOBO_RPC_URL || PUBLIC_RPC
export const USING_PUBLIC_RPC = MAINNET_RPC === PUBLIC_RPC

export class AppConfig {
  // The wallet verifies this site's /.well-known/assetlinks.json against the app's signing key. The verifier
  // wants Content-Type exactly "application/json"; GitHub Pages adds a charset, so the docs site is on Vercel
  // (docs/api/assetlinks.js serves it). Phantom declined every saved session until this moved (2026-10-11).
  static identity: AppIdentity = { name: 'Kobo', uri: 'https://kobo-till.vercel.app', icon: 'favicon.png' }
  static networks: SolanaCluster[] = [
    // A test build on devnet says so to the wallet: test wallets refuse to send on solana:localnet.
    ...(TEST_RPC ? [/devnet/.test(TEST_RPC) ? createSolanaDevnet({ url: TEST_RPC }) : createSolanaLocalnet({ url: TEST_RPC })] : []),
    createSolanaMainnet({ url: MAINNET_RPC }),
    createSolanaDevnet({ url: 'https://api.devnet.solana.com' }),
  ]
}

export const TIMING = {
  pollFastMs: USING_PUBLIC_RPC ? 2000 : 1000,
  pollSlowMs: 10000,
  fastForMs: 60 * 60_000, // a sale is checked every pollFastMs for its first hour (a payment link lives an hour)
  watchForMs: 24 * 60 * 60_000, // after that only every pollSlowMs, and not at all after a day
  maxFastSales: 3,
  stillWaitingMs: 600_000,
} as const

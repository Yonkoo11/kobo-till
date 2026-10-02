import { AppIdentity, createSolanaDevnet, createSolanaMainnet, SolanaCluster } from '@wallet-ui/react-native-kit'
import { PUBLIC_RPC } from '@/core/constants'

// A Helius (or other) URL goes in app/.env as EXPO_PUBLIC_KOBO_RPC_URL; never commit it.
export const MAINNET_RPC = process.env.EXPO_PUBLIC_KOBO_RPC_URL || PUBLIC_RPC
export const USING_PUBLIC_RPC = MAINNET_RPC === PUBLIC_RPC

export class AppConfig {
  static identity: AppIdentity = { name: 'Kobo' }
  static networks: SolanaCluster[] = [
    createSolanaMainnet({ url: MAINNET_RPC }),
    createSolanaDevnet({ url: 'https://api.devnet.solana.com' }),
  ]
}

export const TIMING = {
  pollFastMs: USING_PUBLIC_RPC ? 2000 : 1000,
  pollSlowMs: 10000,
  maxFastSales: 3,
  stillWaitingMs: 600_000,
} as const

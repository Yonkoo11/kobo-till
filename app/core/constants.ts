import { address } from '@solana/kit'

// Verified 2026-10-02, see CLAUDE.md "Verified Facts".
export const COINS = {
  USDC: { mint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), decimals: 6 },
  USDT: { mint: address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), decimals: 6 },
} as const
export type CoinId = keyof typeof COINS

export const SKR = { mint: address('SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3'), decimals: 6 } as const
export const SGT_GROUP = 'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te'
export const TOKEN_2022_PROGRAM = address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
export const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com'

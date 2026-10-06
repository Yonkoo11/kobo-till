import { describe, expect, it } from 'vitest'
import { walletFailure } from './wallet-error'

describe('walletFailure', () => {
  it.each([
    [new Error('User declined the request'), 'cancelled'],
    [new Error('Blockhash not found'), 'expired'],
    [new Error('block height exceeded'), 'expired'],
    [new Error('Attempt to debit an account but found no record of a prior credit'), 'no-sol'],
    [new Error('insufficient lamports'), 'no-sol'],
    [new Error('socket closed'), 'other'],
    [new Error('fetch failed: java.net.ConnectException: Failed to connect to api.mainnet-beta.solana.com/64.130.57.92:443'), 'offline'],
    [new Error('Network request failed'), 'offline'],
    [new Error('-1/authorization request failed'), 'other'],
  ])('%s -> %s', (e, kind) => expect(walletFailure(e)).toBe(kind))
})

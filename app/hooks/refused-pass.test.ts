import { describe, expect, it } from 'vitest'
import { isRefusedPass } from './use-fresh-send'

describe('isRefusedPass', () => {
  it.each([
    [new Error('-1/authorization request failed'), true], // Phantom, 2026-10-06
    [Object.assign(new Error('auth token not valid'), { code: -1 }), true],
    [new Error('-3/sign request declined'), false],
    [new Error('-2/payloads invalid for signing'), false],
    [new Error('fetch failed: java.net.ConnectException'), false],
  ])('%s -> %s', (e, want) => expect(isRefusedPass(e)).toBe(want))
})

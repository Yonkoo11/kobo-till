import { describe, expect, it } from 'vitest'
import { isBusy, retryWhenBusy } from './busy'

const busy = () => Object.assign(new Error('HTTP error (429): Too Many Requests'), { context: { statusCode: 429 } })
const noSleep = async () => undefined

describe('isBusy', () => {
  it.each([
    [new Error('HTTP error (429): Too Many Requests'), true],
    [new Error('Solana error #8100002; Decode this error by running …'), true],
    [new Error('Network request failed'), false],
    [new Error('HTTP error (503): Service Unavailable'), false],
    [new Error('Blockhash not found'), false],
  ])('%s -> %s', (e, want) => expect(isBusy(e)).toBe(want))
})

describe('retryWhenBusy', () => {
  it('returns the first good answer after busy ones', async () => {
    let calls = 0
    const out = await retryWhenBusy(async () => {
      calls++
      if (calls < 3) throw busy()
      return 'ok'
    }, noSleep)
    expect(out).toBe('ok')
    expect(calls).toBe(3)
  })
  it('gives up after three retries and throws the busy error', async () => {
    let calls = 0
    await expect(retryWhenBusy(async () => { calls++; throw busy() }, noSleep)).rejects.toThrow(/429/)
    expect(calls).toBe(4)
  })
  it('does not retry other failures', async () => {
    let calls = 0
    await expect(retryWhenBusy(async () => { calls++; throw new Error('Network request failed') }, noSleep)).rejects.toThrow(/Network/)
    expect(calls).toBe(1)
  })
  it('waits 1, 2 and 4 seconds between tries', async () => {
    const waits: number[] = []
    await retryWhenBusy(async () => { if (waits.length < 3) throw busy(); return 1 }, async (ms) => { waits.push(ms) })
    expect(waits).toEqual([1000, 2000, 4000])
  })
})

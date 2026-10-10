import { describe, expect, it } from 'vitest'
import { backoffMs } from './backoff'

describe('backoffMs', () => {
  it.each([
    [0, 0],
    [1, 2000],
    [2, 4000],
    [3, 8000],
    [4, 15000],
    [10, 15000],
  ])('%i failures -> %i ms', (n, ms) => expect(backoffMs(n)).toBe(ms))
})

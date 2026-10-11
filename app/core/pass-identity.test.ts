import { describe, expect, it } from 'vitest'
import { passIdentity, rememberPassIdentity } from './pass-identity'

describe('pass identity', () => {
  it('starts empty, then returns the address last remembered', async () => {
    expect(await passIdentity()).toBeNull()
    await rememberPassIdentity('https://kobo-till.vercel.app')
    expect(await passIdentity()).toBe('https://kobo-till.vercel.app')
    await rememberPassIdentity('https://example.com')
    expect(await passIdentity()).toBe('https://example.com')
  })
})

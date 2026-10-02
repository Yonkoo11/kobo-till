import { createSolanaRpc } from '@solana/kit'
import { useMemo } from 'react'
import { useNetwork } from '@/features/network/use-network'

export function useRpc() {
  const { endpoint } = useNetwork()
  return useMemo(() => createSolanaRpc(endpoint), [endpoint])
}

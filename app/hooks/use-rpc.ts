import { createKoboRpc } from '@/core/rpc'
import { useMemo } from 'react'
import { useNetwork } from '@/features/network/use-network'

export function useRpc() {
  const { endpoint } = useNetwork()
  return useMemo(() => createKoboRpc(endpoint), [endpoint])
}

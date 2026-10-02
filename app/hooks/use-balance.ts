import { address } from '@solana/kit'
import { useQuery } from '@tanstack/react-query'
import { COINS } from '@/core/constants'
import { useRpc } from './use-rpc'

/** Dollars held by the shop wallet (USDC + USDT, or one coin), in 6-decimal base units. */
export function useDollarBalance(owner: string | null, only?: 'USDC' | 'USDT') {
  const rpc = useRpc()
  return useQuery({
    queryKey: ['dollars', owner, only],
    enabled: !!owner,
    refetchInterval: 30000,
    queryFn: async () => {
      let total = 0n
      for (const c of only ? [COINS[only]] : Object.values(COINS)) {
        const r = await rpc.getTokenAccountsByOwner(address(owner!), { mint: c.mint }, { encoding: 'jsonParsed' }).send()
        for (const a of r.value as any[]) total += BigInt(a.account.data.parsed.info.tokenAmount.amount)
      }
      return total
    },
  })
}

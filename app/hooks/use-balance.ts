import { address, isSolanaError, SOLANA_ERROR__JSON_RPC__INVALID_PARAMS } from '@solana/kit'
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
        // A coin that does not exist on this network (USDT on a local test network) holds nothing.
        const r = await rpc
          .getTokenAccountsByOwner(address(owner!), { mint: c.mint }, { encoding: 'jsonParsed' })
          .send()
          .catch((e: unknown) => {
            const notFound =
              isSolanaError(e, SOLANA_ERROR__JSON_RPC__INVALID_PARAMS) && /could not find mint/i.test(e.context.__serverMessage)
            if (notFound) return { value: [] }
            throw e
          })
        for (const a of r.value as any[]) total += BigInt(a.account.data.parsed.info.tokenAmount.amount)
      }
      return total
    },
  })
}

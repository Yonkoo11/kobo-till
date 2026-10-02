import {
  Address,
  Instruction,
} from '@solana/kit'
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token'
import { getAddMemoInstruction } from '@solana-program/memo'

export async function ata(owner: Address, mint: Address): Promise<Address> {
  const [pda] = await findAssociatedTokenPda({ owner, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS })
  return pda
}

/** Send `amount` of `mint` from the shop wallet to `to`, creating `to`'s account only when `createTo`. */
export async function transferIx(args: {
  from: Address
  to: Address
  mint: Address
  decimals: number
  amount: bigint
  createTo: boolean
  memo?: string
}): Promise<Instruction[]> {
  const source = await ata(args.from, args.mint)
  const destination = await ata(args.to, args.mint)
  const out: Instruction[] = []
  if (args.createTo) {
    out.push(
      getCreateAssociatedTokenIdempotentInstruction({
        payer: args.from as never,
        ata: destination,
        owner: args.to,
        mint: args.mint,
      }),
    )
  }
  out.push(
    getTransferCheckedInstruction({
      source,
      mint: args.mint,
      destination,
      authority: args.from,
      amount: args.amount,
      decimals: args.decimals,
    }),
  )
  if (args.memo) out.push(getAddMemoInstruction({ memo: args.memo }))
  return out
}

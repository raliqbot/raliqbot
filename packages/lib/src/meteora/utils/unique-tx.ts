import { ComputeBudgetProgram, Transaction } from "@solana/web3.js";

export const toUniqueTx = (units: number,...transactions: Transaction[]) => {
  const instructions = [];

  for (const transaction of transactions) {
    instructions.push(
      ...transaction.instructions.filter((instruction) => {
        if (instruction.programId.equals(ComputeBudgetProgram.programId))
          return false;

        return true;
      })
    );
  }

  return new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units,
    }),
    ...instructions
  );
};

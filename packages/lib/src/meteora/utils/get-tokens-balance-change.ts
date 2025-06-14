import { Connection } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";

export const get_token_balance_change_from_signatures = async (
  connection: Connection,
  ...signatures: string[]
) => {
  const transactions = await connection.getParsedTransactions(
    signatures
  );

  const signaturesTokenBalances: Record<string, string>[] = [];

  for (const parsedTransaction of transactions) {
    const tokenBalances: Record<string, bigint> = {};
    if (parsedTransaction && parsedTransaction.meta) {
      const {
        meta: {
          postBalances,
          preBalances,
          preTokenBalances,
          postTokenBalances,
        },
      } = parsedTransaction;

      const mintWithTokenBalances: Record<
        string,
        { pre: bigint; post: bigint }
      > = {};

      if (preTokenBalances) {
        for (let index = 0; index < preTokenBalances.length; index++) {
          const { uiTokenAmount, mint } = preTokenBalances[index];

          if (mintWithTokenBalances[mint]) continue;

          mintWithTokenBalances[mint] = {
            post: BigInt(0),
            pre: BigInt(uiTokenAmount.amount),
          };
        }
      }

      if (postTokenBalances) {
        for (let index = 0; index < postTokenBalances.length; index++) {
          const { uiTokenAmount, mint } = postTokenBalances[index];
          if (mintWithTokenBalances[mint].post > 0) continue;

          mintWithTokenBalances[mint].post += BigInt(uiTokenAmount.amount);
        }
      }

      for (const [mint, { pre, post }] of Object.entries(
        mintWithTokenBalances
      )) {
        const delta = post - pre;
        const balanceChange = (tokenBalances[mint] || BigInt(0)) + delta;
        if (balanceChange > 0) tokenBalances[mint] = balanceChange;
        else tokenBalances[mint] = balanceChange * BigInt(-1);
      }

      for (
        let index = 0;
        index < Math.max(preBalances.length, postBalances.length);
        index++
      ) {
        const preBalance = preBalances[index];
        const postBalance = postBalances[index];
        const mint = NATIVE_MINT.toBase58();
        const balanceChange = BigInt(postBalance) - BigInt(preBalance);

        tokenBalances[mint] =
          (tokenBalances[mint] || BigInt(0)) + balanceChange;
      }
    }

    signaturesTokenBalances.push(
      Object.fromEntries(
        Object.entries(tokenBalances).map(([key, value]) => [
          key,
          value.toString(),
        ])
      )
    );
  }

  return signaturesTokenBalances;
};

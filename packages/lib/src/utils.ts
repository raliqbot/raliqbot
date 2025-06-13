import { BN } from "bn.js";
import assert from "assert";
import Decimal from "decimal.js";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT, NATIVE_MINT_2022 } from "@solana/spl-token";

export const is_valid_address = (address: string) => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

const NATIVE_MINTS: PublicKey[] = [NATIVE_MINT, NATIVE_MINT_2022];

export const is_native_mint = (mint: string | PublicKey) => {
  const address = new PublicKey(mint);
  return NATIVE_MINTS.some((mint) => mint.equals(address));
};

export function parse_amount(
  value: number | string | bigint | Decimal,
  decimals?: number
): bigint {
  if (typeof value === "number") {
    assert(decimals, "decimals is required");
    return BigInt(new Decimal(value).mul(Math.pow(10, decimals)).toFixed(0));
  }

  if (value instanceof Decimal) return BigInt(value.toFixed(0));

  return BigInt(value);
}

export function parse_amount_decimal(
  value: number | string | bigint,
  decimals?: number
): Decimal {
  if (typeof value === "number") {
    assert(decimals, "decimals is required");
    return new Decimal(value).mul(Math.pow(10, decimals));
  }
  return new Decimal(value.toString());
}

export const to_bn = (value: bigint) => new BN(value.toString());

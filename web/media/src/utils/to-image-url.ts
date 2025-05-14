import { format } from "@raliqbot/shared";

export const getTokenImage = (url: string, address?: string) => {
  if (url.trim().length > 0) return url;
  return format(
    "https://img-v1.raydium.io/icon/%.png",
    address ? address : url
  );
};

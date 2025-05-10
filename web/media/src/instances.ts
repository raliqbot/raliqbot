import { API, BitQuery } from "@raliqbot/lib";

export const api = new API(process.env.NEXT_PUBLIC_API_BASE_URL)
export const bitquery = new BitQuery(process.env.NEXT_PUBLIC_BITQUERY_ACCESS_TOKEN)

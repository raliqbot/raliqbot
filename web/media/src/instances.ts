import { RaliqbotClient } from "@raliqbot/lib";

export const api = new RaliqbotClient(process.env.NEXT_PUBLIC_API_BASE_URL);

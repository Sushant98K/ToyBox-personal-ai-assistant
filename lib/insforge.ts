import { createClient } from "@insforge/sdk";

const baseUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  process.env.API_BASE_URL ||
  "https://ngyj8b8k.us-east.insforge.app";

const anonKey =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
  process.env.API_KEY ||
  "ik_d0daa57f7ae3ddbb2447e29367a3bc62";

export const insforge = createClient({
  baseUrl,
  anonKey,
});

export default insforge;

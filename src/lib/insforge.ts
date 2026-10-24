import { createClient } from "@insforge/sdk";

const baseUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  process.env.API_BASE_URL ||
  process.env.INSFORGE_BASE_URL ||
  "";

const anonKey =
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
  process.env.API_KEY ||
  process.env.INSFORGE_API_KEY ||
  "";

export const insforge = createClient({
  baseUrl,
  anonKey,
});

export default insforge;

import { createAdminClient } from "@insforge/sdk";

const baseUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  process.env.API_BASE_URL ||
  "https://ngyj8b8k.us-east.insforge.app";

const apiKey =
  process.env.INSFORGE_API_KEY ||
  process.env.API_KEY ||
  "ik_d0daa57f7ae3ddbb2447e29367a3bc62";

export const insforgeAdmin = createAdminClient({
  baseUrl,
  apiKey,
});

export default insforgeAdmin;

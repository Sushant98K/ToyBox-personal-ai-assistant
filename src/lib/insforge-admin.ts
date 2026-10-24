import { createAdminClient } from "@insforge/sdk";

const baseUrl =
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  process.env.API_BASE_URL ||
  process.env.INSFORGE_BASE_URL ||
  "";

const apiKey =
  process.env.INSFORGE_API_KEY ||
  process.env.API_KEY ||
  "";

export const insforgeAdmin = createAdminClient({
  baseUrl,
  apiKey,
});

export default insforgeAdmin;

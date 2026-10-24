import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IntegrationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("tab", "integrations");

  for (const [key, value] of Object.entries(params)) {
    if (key !== "tab") {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else if (value !== undefined) {
        query.set(key, value);
      }
    }
  }

  redirect(`/dashboard?${query.toString()}`);
}


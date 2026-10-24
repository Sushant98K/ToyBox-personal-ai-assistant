import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/integrations",
        destination: "/dashboard?tab=integrations",
        permanent: false,
      },
      {
        source: "/agent",
        destination: "/dashboard?tab=ai-agent",
        permanent: false,
      },
      {
        source: "/ai-agent",
        destination: "/dashboard?tab=ai-agent",
        permanent: false,
      },
      {
        source: "/briefing",
        destination: "/dashboard?tab=briefing",
        permanent: false,
      },
      {
        source: "/alerts",
        destination: "/dashboard?tab=alerts",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/dashboard?tab=settings",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

import { Suspense } from "react";
import { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard";
import { siteConfig } from "@/config";

export const metadata: Metadata = {
  title: `Executive Dashboard – ${siteConfig.name}`,
  description: `Monitor autonomous agents, review multi-channel executive briefings, and manage communication integrations.`,
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[var(--canvas)] text-[var(--ink)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
            <span className="text-xs font-[600] text-[var(--text-muted)]">
              Loading executive dashboard...
            </span>
          </div>
        </div>
      }
    >
      <DashboardShell />
    </Suspense>
  );
}

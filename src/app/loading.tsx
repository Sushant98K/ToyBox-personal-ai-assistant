import { AgentWaveLoader } from "@/components/feedback/agent-wave-loader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-[var(--canvas)] transition-colors duration-200">
      <AgentWaveLoader label="Loading ToyBox.ai workspace…" durationMs={2400} />
    </div>
  );
}

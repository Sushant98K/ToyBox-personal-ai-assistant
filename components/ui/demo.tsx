import { AuthPage } from "@/components/ui/auth-page";
import { AgentWaveLoader } from "@/components/ui/agent-wave-loader";

export function AgentWaveLoaderDemo() {
  return (
    <div className="flex min-h-[240px] w-full flex-col items-center justify-center gap-10 p-8">
      <AgentWaveLoader />
      <AgentWaveLoader label="Routing to the best model…" />
      <AgentWaveLoader label="Taking my time…" durationMs={4000} />
    </div>
  );
}

export default function DemoOne() {
  return <AuthPage />;
}

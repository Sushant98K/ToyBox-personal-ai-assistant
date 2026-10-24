import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)] text-[var(--ink)] px-4">
      <div className="w-full max-w-md p-8 rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] flex flex-col items-center text-center">
        <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--raised)] border border-[var(--hairline)] text-[var(--text-muted)] mb-4">
          404 Error
        </span>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          The requested route could not be found or has been relocated to another workspace destination.
        </p>
        <Link href="/" className="w-full">
          <Button
            variant="default"
            className="w-full rounded-full flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

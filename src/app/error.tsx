"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)] text-[var(--ink)] px-4">
      <div className="w-full max-w-md p-8 rounded-[24px] bg-[var(--canvas-soft)] border border-[var(--hairline)] flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--raised)] border border-[var(--hairline)] flex items-center justify-center text-[var(--ink)] mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          An unexpected error occurred while executing this operation. You can try reloading or return home.
        </p>
        <div className="flex items-center gap-3 w-full">
          <Button
            onClick={() => reset()}
            variant="default"
            className="flex-1 rounded-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Link href="/" className="flex-1">
            <Button
              variant="outline"
              className="w-full rounded-full flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

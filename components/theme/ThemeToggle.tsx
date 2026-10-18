"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  variant?: "floating" | "inline";
}

export function ThemeToggle({ className = "", variant = "floating" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : "dark";
  const isDark = currentTheme === "dark";

  if (variant === "inline") {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--hairline)] bg-[var(--canvas-soft)] hover:bg-[var(--raised)] text-[var(--ink)] transition-all duration-200 active:scale-95 cursor-pointer ${className}`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isDark ? (
            <Sun className="w-4 h-4 text-[var(--ink)] transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--ink)] transition-transform duration-300 hover:-rotate-12" />
          )}
        </div>
      </button>
    );
  }

  // Floating button pinned to right bottom side with floating effect
  return (
    <aside
      aria-label="Theme selection"
      className="fixed bottom-6 right-6 z-50 select-none pointer-events-auto"
    >
      <button
        onClick={toggleTheme}
        type="button"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Click to switch to ${isDark ? "light" : "dark"} mode`}
        className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[var(--hairline)] bg-[var(--canvas-soft)]/90 hover:bg-[var(--raised)] backdrop-blur-md text-[var(--ink)] shadow-[0_10px_30px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${className}`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
          {isDark ? (
            <Sun className="w-4 h-4 text-[var(--ink)] transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--ink)] transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </div>
        <span className="text-xs font-[600] tracking-tight text-[var(--ink)] whitespace-nowrap">
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      </button>
    </aside>
  );
}

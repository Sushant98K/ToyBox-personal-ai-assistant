"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { mainNav, siteConfig } from "@/config";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-4 z-40 w-full px-4 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Floating Nav Pill - Mobbin stadium pill */}
        <div className="w-full bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-full px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between transition-all duration-200 shadow-sm">
          {/* Brand Logo & Mark */}
          <Link href="/" className="flex items-center gap-3 pl-1 sm:pl-1.5 group">
            <Image
              src="/logos/ToyBox-Logo.png"
              alt="ToyBox.ai"
              width={55}
              height={55}
              className="w-12 h-12 sm:w-12 sm:h-12 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
              priority
            />
            <span className="font-[650] text-[18px] sm:text-[19px] text-[var(--ink)] tracking-tight select-none">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-[600] text-[var(--ink)]">
            {mainNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex text-[14px] font-[600] text-[var(--ink)] px-3.5 py-1.5 hover:text-[var(--ink-soft)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="bg-[var(--primary)] hover:opacity-90 text-[var(--on-primary)] text-[14px] font-[600] px-4 py-2 rounded-full transition-all flex items-center gap-1.5"
            >
              <span>Get started</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-[var(--ink)] hover:bg-[var(--hairline)]/50 rounded-full transition-colors ml-1"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-5xl mx-auto mt-2 pointer-events-auto">
          <div className="bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-[24px] p-5 flex flex-col gap-4 shadow-lg transition-colors">
            {mainNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-[600] text-base text-[var(--ink)] py-1"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 border-t border-[var(--hairline)] flex items-center justify-between">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="font-[600] text-sm text-[var(--ink)]"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[var(--primary)] text-[var(--on-primary)] text-sm font-[600] px-4 py-2 rounded-full"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

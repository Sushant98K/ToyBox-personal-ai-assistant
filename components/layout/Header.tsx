"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, ArrowUpRight } from "lucide-react";
import { mainNav, siteConfig } from "@/config";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Floating Nav Pill */}
        <div className="w-full bg-[#f3f3f3] border border-[#e0e0e0]/70 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between transition-all">
          {/* Brand Logo & Mark */}
          <Link href="/" className="flex items-center gap-2.5 pl-1.5 group">
            <div
              className="w-7 h-7 bg-[#141414] text-white flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ borderRadius: "30%" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-[650] text-[17px] text-[#141414] tracking-tight select-none">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-[600] text-[#141414]">
            {mainNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[#707070] hover:text-[#141414] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a
              href="#signup"
              className="hidden sm:inline-flex text-[14px] font-[600] text-[#141414] px-3.5 py-1.5 hover:text-[#262626] transition-colors"
            >
              Log in
            </a>
            <a
              href="#signup"
              className="bg-[#141414] hover:bg-[#262626] text-white text-[14px] font-[600] px-4 py-2 rounded-full transition-all flex items-center gap-1.5"
            >
              <span>Get started</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-[#141414] hover:bg-[#e0e0e0]/50 rounded-full transition-colors ml-1"
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
          <div className="bg-[#f3f3f3] border border-[#e0e0e0] rounded-[24px] p-5 flex flex-col gap-4">
            {mainNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-[600] text-base text-[#141414] py-1"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 border-t border-[#e0e0e0] flex items-center justify-between">
              <a
                href="#signup"
                onClick={() => setMobileMenuOpen(false)}
                className="font-[600] text-sm text-[#141414]"
              >
                Log in
              </a>
              <a
                href="#signup"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#141414] text-white text-sm font-[600] px-4 py-2 rounded-full"
              >
                Start free trial
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

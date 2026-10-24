"use client";

import React, { useState, useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import {
  HeroSection,
  IntegrationMarquee,
  BentoFeatures,
  WorkflowSection,
  TestimonialsSection,
  PricingSection,
  FaqSection,
  CtaSection,
} from "@/features/landing";
import { AgentWaveLoader } from "@/components/feedback/agent-wave-loader";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial loading display for the main page
    const timer = setTimeout(() => {
      setLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="page-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--canvas)] transition-colors duration-200"
          >
            <AgentWaveLoader label="Initializing ToyBox.ai agents…" durationMs={2200} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] selection:bg-[var(--ink)] selection:text-[var(--canvas)] flex flex-col justify-between transition-colors duration-200">
        {/* Floating Centered Nav Pill */}
        <Header />

        <main className="flex-1">
          {/* Hero Section with Interactive Multi-App Terminal Mockup */}
          <HeroSection />

          {/* Integration Brand Marquee */}
          <IntegrationMarquee />

          {/* Bento Grid Feature Suite */}
          <BentoFeatures />

          {/* Workflow Architecture (How ToyBox.ai Works) */}
          <WorkflowSection />

          {/* Social Proof & Testimonials */}
          <TestimonialsSection />

          {/* Pricing with Segmented Control & Electric Blue Badge */}
          <PricingSection />

          {/* FAQ Accordion */}
          <FaqSection />

          {/* Pre-Footer CTA */}
          <CtaSection />
        </main>

        {/* Full-bleed Polarity Inversion Footer with rounded top corners */}
        <Footer />
      </div>
    </>
  );
}

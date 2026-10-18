import React from "react";
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
} from "@/components/sections";

export default function Home() {
  return (
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

        {/* Workflow Architecture (How Toybox Works) */}
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
  );
}

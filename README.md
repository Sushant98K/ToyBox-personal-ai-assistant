# ToyBox.ai – Task Optimization & Yield Bot for Operations and eXecution

An autonomous AI intelligence engine that unifies **Gmail, Slack, WhatsApp, Telegram, and Microsoft Outlook** to deliver executive morning briefings, real-time thread synthesis, and autonomous reminders.

Engineered with a minimalist, gallery-white monochrome design language following the [`DESIGN-mobbin.md`](Agents/DESIGN-mobbin.md) design specification.

---

## Project Structure & Architecture

The codebase follows the standard Next.js App Router architecture with strict separation of concerns, TypeScript type definitions, and path aliasing (`@/*`):

```
ai-personal-assistant/
├── app/                        # Next.js App Router layer (routing only)
│   ├── favicon.ico
│   ├── globals.css             # Tailwind v4 theme variables & design tokens
│   ├── layout.tsx              # Root HTML layout with Inter variable font
│   └── page.tsx                # Landing page composition
│
├── components/                 # Presentation & UI components
│   ├── icons/                  # Vector brand and app icon definitions
│   │   ├── AppIcons.tsx        # Gmail, Slack, WhatsApp, Telegram, Outlook
│   │   └── index.ts
│   ├── layout/                 # Global layout chrome
│   │   ├── Header.tsx          # Floating stadium nav-pill
│   │   ├── Footer.tsx          # Polarity-inverted ink baseboard with rounded top
│   │   └── index.ts
│   ├── sections/               # Page sections
│   │   ├── HeroSection.tsx     # Hero statement & interactive terminal mockup
│   │   ├── IntegrationMarquee.tsx # Horizontal brand chip ribbon
│   │   ├── BentoFeatures.tsx   # 5-card Bento grid (24px geometry)
│   │   ├── WorkflowSection.tsx # 3-step OAuth & synthesis architecture
│   │   ├── TestimonialsSection.tsx # Testimonial cards with circular avatars
│   │   ├── PricingSection.tsx  # Segmented billing toggle with electric blue badge
│   │   ├── FaqSection.tsx      # Accordion items with 16px radius
│   │   ├── CtaSection.tsx      # Pre-footer stadium trial form
│   │   └── index.ts
│   └── index.ts                # Master components barrel export
│
├── config/                     # Static configuration & data separation
│   ├── site.ts                 # App metadata, name, navigation links
│   ├── integrations.ts         # Supported inboxes and OAuth configurations
│   ├── pricing.ts              # Tier features, pricing, and badges
│   ├── faqs.ts                 # Frequently asked questions and answers
│   ├── testimonials.ts         # Customer quotes and credentials
│   └── index.ts                # Master config barrel export
│
├── types/                      # TypeScript definitions & data contracts
│   └── index.ts
│
├── Agents/                     # Design guidelines & design tokens
│   └── DESIGN-mobbin.md
│
├── next.config.ts              # Next.js configuration
├── package.json
├── tsconfig.json               # Configured with "@/*": ["./*"] path alias
└── README.md
```

---

## Design System Rules (from `DESIGN-mobbin.md`)

- **Monochrome Foundation**: `#ffffff` canvas with `#141414` ink black typography.
- **Elevation via Tint Ladder**: Zero drop shadows. Depth is achieved strictly using `#f3f3f3` (canvas-soft), `#f0f0f0` (field & hairline-soft), and `#e0e0e0` (hairline).
- **Sole Commercial Accent**: Electric Blue (`#0066ff`) is reserved exclusively for commercial signals (the *"Most Popular"* pricing badge and *"-20% Save"* annual callout). Never used decoratively or for CTA buttons.
- **Stadium-Pill Interactive Language**: Every button, navigation bar, toggle, and chip is a stadium pill (`rounded-full`).
- **Card Geometry**: Containers sit at `24px` radius (`rounded-[24px]`), internal elements at `16px` (`rounded-[16px]`), and app icons use the signature iOS `30%` squircle silhouette.
- **Typographic Voice**: Headings set in Saans/Inter at variable weight 650 with tight line-height (1.03–1.13) ending with a terminal period. Subtitles set in weight 300 Light (`font-[300]`).

---

## Development

Run the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linter:

```bash
npm run lint
```

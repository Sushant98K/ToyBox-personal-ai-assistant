---
description: Instructions building apps with MCP
globs: *
alwaysApply: true
---

# InsForge SDK Documentation - Overview

## What is InsForge?

Backend-as-a-service (BaaS) platform providing:

- **Database**: PostgreSQL with PostgREST API
- **Authentication**: Email/password + OAuth (Google, GitHub)
- **Storage**: File upload/download
- **AI**: OpenRouter key provisioning and model catalog for direct OpenAI-compatible integrations
- **Functions**: Serverless function deployment
- **Realtime**: WebSocket pub/sub (database + client events)

## Installation

The following is a step-by-step guide to installing and using the InsForge TypeScript SDK for Web applications. If you are building other types of applications, please refer to:
- [Swift SDK documentation](/sdks/swift/overview) for iOS, macOS, tvOS, and watchOS applications.
- [Kotlin SDK documentation](/sdks/kotlin/overview) for Android applications.
- [REST API documentation](/sdks/rest/overview) for direct HTTP API access.

### 🚨 CRITICAL: Follow these steps in order

### Step 1: Download Template

Use the `download-template` MCP tool to create a new project with your backend URL and anon key pre-configured.

### Step 2: Install SDK

```bash
npm install @insforge/sdk@latest
```

### Step 3: Create SDK Client

You must create a client instance using `createClient()` with your base URL and anon key:

```javascript
import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || process.env.API_BASE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || process.env.API_KEY
});

```

**API BASE URL**: Configured in `.env` (`API_BASE_URL` / `NEXT_PUBLIC_INSFORGE_URL`).

## Getting Detailed Documentation

### 🚨 CRITICAL: Always Fetch Documentation Before Writing Code

InsForge provides official SDKs and REST APIs, use them to interact with InsForge services from your application code.

- [TypeScript SDK](/sdks/typescript/overview) - JavaScript/TypeScript
- [Swift SDK](/sdks/swift/overview) - iOS, macOS, tvOS, and watchOS
- [Kotlin SDK](/sdks/kotlin/overview) - Android and Kotlin Multiplatform
- [REST API](/sdks/rest/overview) - Direct HTTP API access

Before writing or editing any InsForge integration code, you **MUST** call the `fetch-docs` or `fetch-sdk-docs` MCP tool to get the latest SDK documentation. This ensures you have accurate, up-to-date implementation patterns.

### Use the InsForge `fetch-docs` MCP tool to get specific SDK documentation:

Available documentation types:

- `"instructions"` - Essential backend setup (START HERE)
- `"real-time"` - Real-time pub/sub (database + client events) via WebSockets
- `"db-sdk-typescript"` - Database operations with TypeScript SDK
- **Authentication** - Choose based on implementation:
  - `"auth-sdk-typescript"` - TypeScript SDK methods for custom auth flows
  - `"auth-components-react"` - Pre-built auth UI for React+Vite (single-page app)
  - `"auth-components-react-router"` - Pre-built auth UI for React(Vite+React Router) (multi-page app)
  - `"auth-components-nextjs"` - Pre-built auth UI for Next.js (SSR app)
- `"storage-sdk"` - File storage operations
- `"functions-sdk"` - Serverless functions invocation
- `"ai-integration-sdk"` - AI integration with the provisioned OpenRouter key and OpenAI SDK
- `"deployment"` - Deploy frontend applications via MCP tool
- `"payments"` - Stripe Checkout, Billing Portal, webhook projections, and fulfillment patterns

These docs are mostly for the TypeScript SDK. For other languages, you can also use the `fetch-sdk-docs` MCP tool to get specific documentation.

### Use the InsForge `fetch-sdk-docs` MCP tool to get specific SDK documentation

You can fetch SDK documentation using the `fetch-sdk-docs` MCP tool with a specific feature type and language.

Available feature types:
- `db` - Database operations
- `storage` - File storage operations
- `functions` - Serverless functions invocation
- `auth` - User authentication
- `ai` - AI integration with the provisioned OpenRouter key and OpenAI SDK
- `realtime` - Real-time pub/sub (database + client events) via WebSockets
- `payments` - Stripe Checkout and Billing Portal with webhook-based fulfillment

Available languages:
- `typescript` - JavaScript/TypeScript SDK
- `swift` - Swift SDK (for iOS, macOS, tvOS, and watchOS)
- `kotlin` - Kotlin SDK (for Android and JVM applications)
- `rest-api` - REST API

Payments currently has TypeScript SDK docs only. Use the Payments API reference for non-TypeScript clients.

## When to Use SDK vs MCP Tools

### Always SDK for Application Logic:

- Authentication (register, login, logout, profiles)
- Database CRUD (select, insert, update, delete)
- Storage operations (upload, download files)
- AI integration via the provisioned OpenRouter key with the OpenAI SDK or OpenRouter HTTP API
- Serverless function invocation
- Payments checkout and customer portal session creation

### Use MCP Tools for Infrastructure:

- Project scaffolding (`download-template`) - Download starter templates with InsForge integration
- Backend setup and metadata (`get-backend-metadata`)
- Database schema management (`run-raw-sql`, `get-table-schema`)
- Storage bucket creation (`create-bucket`, `list-buckets`, `delete-bucket`)
- Serverless function deployment (`create-function`, `update-function`, `delete-function`)
- Frontend deployment (`create-deployment`) - Deploy frontend apps to InsForge hosting

## Important Notes

- For auth: use `auth-sdk` for custom UI, or framework-specific components for pre-built UI
- SDK returns `{data, error}` structure for all operations
- Database inserts require array format: `[{...}]`
- Serverless functions have one endpoint and do not support nested route paths
- Storage: Upload files to buckets, store URLs in database
- AI integrations should call OpenRouter directly with `baseURL: "https://openrouter.ai/api/v1"` and a server-side `OPENROUTER_API_KEY`
- **EXTRA IMPORTANT**: Use Tailwind CSS 3.4 (do not upgrade to v4). Lock these dependencies in `package.json`

## Development Rules

### Main Rule
- Work with minimal changes. Do not rewrite unrelated code. Do not scan the full project unless required.

### Token Saving Rules
- Inspect only files needed for the current task.
- Do not read the whole codebase unless asked.
- Do not output full files unless requested.
- Use targeted edits instead of rewriting large files.
- Keep final response short.
- Mention only changed files and what changed.
- Do not explain obvious code.
- Do not repeat the user request.
- Do not create unnecessary abstractions.
- Do not install new packages unless absolutely needed.

### Code Style
- Write clean, simple, production-ready code.
- Use TypeScript properly.
- Avoid any `any` unless there is no better option.
- Follow existing folder structure.
- Follow existing naming conventions.
- Reuse existing utilities, hooks, components, and styles.
- Do not refactor working code unless requested.
- Avoid duplicate code.

### Component Rules
- Create small reusable components.
- Keep page files mostly for layout and data flow.
- Move repeated UI into components.
- Move business logic into hooks, server actions, or utilities.
- Avoid very large JSX blocks.
- Keep components focused on one responsibility.
- Keep "use client" as low as possible.

### Next.js Rules
- Use Server Components by default.
- Use Client Components only for state, effects, browser APIs, or user interactions.
- Use server actions or API routes for backend logic.
- Validate input before database operations.
- Add loading, error, and empty states where needed.
- Never expose secrets to the client.

### UI & Design System Rules (Mobbin)
- Follow the Mobbin design system specifications in `Agents/DESIGN.md`, `Agents/light-theme.png`, and `Agents/dark-theme.png`.
- **Dark theme is default** across the application.
- **Theme Selection Floating Control**:
  - The theme toggle button is pinned to the **bottom-right side** (`fixed bottom-6 right-6 z-50`).
  - It uses a floating stadium pill (`rounded-full`) with `backdrop-blur-md`, subtle depth shadow, `border-[var(--hairline)]`, and smooth hover scale effects.
  - It stays permanently visible sticking to the bottom-right viewport corner across all scrolls and pages.
- **Exact Token Ladder**:
  - **Dark Mode (Default per `dark-theme.png`)**:
    - `--primary`: `#f5f5f5` (Polar White: primary CTA pills & display headings)
    - `--accent`: `#0066ff` (Electric Blue: commercial signals only)
    - `--canvas`: `#141414` (Neutral near-black page canvas, never pure #000)
    - `--canvas-soft`: `#1d1d1d` (Lifted tier: nav pill, featured cards, FAQ rows, footer band)
    - `--raised`: `#242424` (Brightest neutral fill: active toggle pills & lifted chrome)
    - `--field`: `#1e1e1e` (Form input fill, presence without borders)
    - `--hairline-soft`: `#262626` (1px outlines on dark-on-dark cards)
    - `--hairline`: `#333333` (Stronger control border: outlined pills, interactive chrome)
    - `--ink`: `#f5f5f5` (Headings, body copy, nav links)
    - `--ink-soft`: `#e2e2e2` (Slightly dimmed white for secondary lockups)
    - `--text-muted`: `#a0a0a0` (Secondary copy, descriptions, vote counts)
    - `--text-faint`: `#707070` (Placeholders, de-emphasized links, fine print)
    - `--on-primary`: `#141414` (Near-black labels on polar white CTA)
  - **Light Mode (per `light-theme.png`)**:
    - `--primary`: `#141414` (Ink Black: primary CTA pill fill, footer band)
    - `--accent`: `#0066ff` (Electric Blue: popular badges & savings callouts)
    - `--canvas`: `#ffffff` (Pure white canvas)
    - `--canvas-soft`: `#f3f3f3` (6% ink wash: nav pill, featured card, FAQ rows)
    - `--raised`: `#ffffff` (Active toggle pills)
    - `--field`: `#f0f0f0` (8% ink wash: form input fill)
    - `--hairline-soft`: `#f0f0f0` (1px outlines on white cards)
    - `--hairline`: `#e0e0e0` (16% control border: outlined pill buttons, chrome)
    - `--ink`: `#141414` (Headings, body copy, nav links)
    - `--ink-soft`: `#262626` (Secondary lockups)
    - `--text-muted`: `#707070` (Secondary copy)
    - `--text-faint`: `#adadad` (Tertiary text, placeholders)
    - `--on-primary`: `#ffffff` (Labels on ink fills)
- Interactive controls must adhere to the stadium pill geometry (`rounded-full`), and card containers sit at `rounded-[24px]` (`rounded-md`).
- App icon tiles render as iOS-style 30% squircles (`style={{ borderRadius: "30%" }}`).
- Never use drop shadows for elevation; rely strictly on the neutral tint ladder and 1px hairlines.
- Keep the electric blue accent (`#0066ff`) reserved solely for commercial/decision signals (e.g., Popular badges, savings callouts).
- Keep UI minimal, clean, responsive, and consistent.
- Avoid one-off styling.
- Use consistent spacing, typography, and colors.
- Do not redesign unrelated screens.

### Database/Auth Rules
- Do not change schema unless asked.
- Reuse existing database client.
- Always verify authenticated user before saving private data.
- Always associate user-owned data with userId.
- Do not duplicate user records.
- Store only necessary user information.

### Workflow
#### Before coding:
- Identify the smallest set of files needed.
- Check existing components/utilities first.
- Make the smallest safe change.

#### After coding:
- Run type check or relevant test if available.
- Summarize changed files only.
- Keep response concise.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **ai-personal-assistant** (API base configured in `.env`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env` / `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

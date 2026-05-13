# Shared Package Inventory

**For AI coding agents.** This file lists the purpose of every shared package in the `packages/` directory. For detailed exports, dependencies, and rules, see `81-conventions.md` and each package's `README.md`.

| Package | Purpose |
|---------|---------|
| `@firm/types` | Shared TypeScript interfaces and branded IDs |
| `@firm/validators` | Zod v4 schemas for all entities |
| `@firm/api-contracts` | tRPC route schemas, REST/OpenAPI, Inngest event registry |
| `@firm/db` | Drizzle schema, database client, RLS helpers |
| `@firm/ui` | React component library |
| `@firm/tokens` | Design tokens (W3C DTCG → CSS/TS) |
| `@firm/auth` | Better Auth integration, session management, RBAC helpers |
| `@firm/seo` | Metadata, sitemap, structured data (JSON‑LD) |
| `@firm/forms` | Schema‑driven form rendering & submission |
| `@firm/analytics` | Typed event tracking (Umami, PostHog, GA4) |
| `@firm/consent` | Consent banner, GPC enforcement |
| `@firm/background-jobs` | Inngest wrapper, typed job dispatch |
| `@firm/observability` | Pino logger, Prometheus metrics, OpenTelemetry |
| `@firm/email` | Email sending (Resend + SMTP fallback) |
| `@firm/i18n` | Internationalization (next‑intl) |
| `@firm/ai-core` | LLM gateway, model routing, token budget |
| `@firm/ai-content` | AI content generation (blogs, social, email) |
| `@firm/ai-brand-voice` | Per‑client brand voice modeling |
| `@firm/ai-seo` | AI‑driven SEO content & metadata |
| `@firm/config` | Shared TS, ESLint, Prettier, Next.js, Tailwind configs |
| `adapters-*` | Third‑party integrations (CRM, email, analytics, AI, storage, billing, ECAPI) |

---

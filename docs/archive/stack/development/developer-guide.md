# [DRAFT] Developer Onboarding Guide – How to Set Up Your Local Environment

**Created: May 2026**  
*This guide covers the end‑to‑end process for setting up the platform monorepo on a new development machine, validating the environment, and shipping a first change. It is the single entry point for new developers and should be followed sequentially.*

---

## 1. Before You Start

### 1.1 Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| **Operating System** | macOS 14+, Windows 11 (WSL2), Ubuntu 24.04+ | macOS 15+ with Apple Silicon |
| **RAM** | 16 GB | 32 GB (for large Turborepo builds and parallel dev servers) |
| **Processor** | Modern x86-64 or ARM64 | Apple M3/M4 or AMD Zen 5 equivalent |
| **Disk Space** | 20 GB free | 50 GB free (for Docker images, cached builds, and dependencies) |
| **Node.js** | 22.0+ (LTS) | 24.x (LTS as of April 2026) |
| **Docker** | Docker Desktop 4.40+ or Docker Engine 27+ | Latest stable |
| **Git** | 2.48+ | Latest stable |

> **Important:** Node.js 22+ is a hard requirement. pnpm 11 dropped support for Node 18, 19, 20, and 21. Next.js 16 requires at minimum Node.js 20.9, but our toolchain requires 22+.

### 1.2 Access You'll Need

Before your start date (your onboarding buddy should prepare these):

- [ ] GitHub organisation membership (with repository access to the monorepo)
- [ ] Vercel team membership (for preview deployments and remote cache)
- [ ] Infisical project membership (for development secrets)
- [ ] Neon project membership (for database access)
- [ ] Coolify dashboard access (for self-hosted service visibility)
- [ ] Slack channel invitations: `#eng-general`, `#eng-alerts`, `#eng-announce`
- [ ] 1Password vault access (for shared credentials)

---

## 2. One‑Command Bootstrap

We maintain a bootstrap script that automates the full setup. If your machine meets the prerequisites above, run:

```bash
# Clone the monorepo
git clone git@github.com:agency-name/platform.git
cd platform

# Run the bootstrap script
pnpm bootstrap
```

**What the bootstrap script does:**
1. Verifies Node.js ≥22.0 and Docker are installed
2. Enables Corepack and installs the exact pnpm version declared in `package.json`
3. Runs `pnpm install` (first install may take 2–3 minutes; subsequent installs with the SQLite store are sub‑30s)
4. Copies `.env.example` files to `.env.local` in each app (prompting for Infisical CLI setup)
5. Runs `pnpm db:setup` to initialise PGlite for local testing and Neon Local for cloud database access
6. Verifies that `pnpm dev` starts without errors in Turbopack

If you prefer to walk through each step manually (or need to troubleshoot), follow the sections below.

---

## 3. Manual Environment Setup

### 3.1 Install Node.js via Volta

We standardise on **Volta** for Node.js version management. It reads the `volta.node` field in `package.json` and auto‑switches to the correct version when you `cd` into the project.

```bash
# Install Volta
curl https://get.volta.sh | bash
# Restart your shell, then:
volta --version  # verify installation

# Volta will automatically install and use the Node version declared in package.json
#   "volta": { "node": "24.3.0" }
```

**Why Volta over nvm/fnm:** Volta pins versions in `package.json`, so every developer and CI runs the identical Node.js version without manual switching. It also manages package manager versions (pnpm, yarn) per‑project.

### 3.2 Enable Corepack and Pin pnpm

Corepack is bundled with Node.js and ensures every developer uses the exact pnpm version declared in the `packageManager` field of `package.json`:

```bash
# Enable Corepack (one-time)
corepack enable

# Verify pnpm is available and shows the pinned version
pnpm --version
# Should output: 11.0.0 (or whatever is declared in packageManager)
```

The root `package.json` contains:
```json
{
  "packageManager": "pnpm@11.0.0",
  "volta": {
    "node": "24.3.0"
  }
}
```

Corepack automatically downloads and caches the correct pnpm binary – no global install required.

### 3.3 Install Dependencies

```bash
pnpm install
```

**What to expect:**
- First install: 1–2 minutes as the store is populated
- Subsequent installs: 10–20 seconds thanks to pnpm v11's SQLite‑backed store index
- Hardened security: packages less than 1 day old are blocked by default (`minimumReleaseAge: 1440`)

If you encounter a `blockExoticSubdeps` error, a dependency is using a non‑standard resolution pattern. Report it to the platform team – do not override the setting locally.

### 3.4 Set Up Environment Variables

We use **Infisical** for secrets management. Development secrets are never committed to the repository.

```bash
# Install Infisical CLI
pnpm add -g @infisical/cli

# Authenticate (once per machine)
infisical login

# Pull development secrets into .env.local files
pnpm env:pull
```

**What you'll get:** Each app directory (`apps/clients/*`, `apps/platform-portal`, etc.) will have a `.env.local` file populated with the development‑environment secrets. These files are git‑ignored.

**Required variables** (minimum set):
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon connection string (pooled) for full‑stack apps |
| `BETTER_AUTH_SECRET` | Encryption key for session tokens (dev only) |
| `BETTER_AUTH_URL` | Base URL for Better Auth (dev: `http://localhost:3000`) |
| `RESEND_API_KEY` | Email provider API key (dev sandbox) |
| `INNGEST_EVENT_KEY` | Local dev defaults to `local` |
| `INNGEST_SIGNING_KEY` | Local dev defaults to `local` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile (dev always‑pass key) |

---

## 4. Local Infrastructure

### 4.1 Database: Two Modes

The platform supports two local database modes:

| Mode | When to Use | Setup |
|---|---|---|
| **PGlite** (WASM) | Unit/integration tests, quick feature work that doesn't need Neon extensions | Zero config – `pnpm test` uses it automatically |
| **Neon Local** (Docker proxy) | Full‑stack development requiring RLS, pgvector, branching, or production‑realistic data | `docker compose up neon-local` |

**PGlite details:** PGlite is a 3MB WASM build of PostgreSQL. It runs in‑process (no Docker), supports pgvector, and is used by Vitest for all database‑dependent tests. Each test file gets a pristine in‑memory database that is destroyed when the test completes.

**Neon Local details:** Neon Local is a Docker‑based proxy that exposes a `localhost:5432` endpoint connected to your Neon cloud database. It supports ephemeral branches (auto‑create on `docker compose up`, auto‑delete on `docker compose down`) and works with both the standard Postgres driver and the Neon serverless driver.

```bash
# Start Neon Local (ephemeral branch from dev parent)
docker compose up neon-local

# Your app connects to:
# DATABASE_URL=postgresql://localhost:5432/neondb
```

### 4.2 Background Jobs: Inngest Dev Server

The Inngest Dev Server provides full production parity locally. It auto‑discovers your app's Inngest endpoint and exposes a dashboard at `http://localhost:8288`.

```bash
# Terminal 1: Start the Next.js dev server
pnpm dev

# Terminal 2: Start the Inngest Dev Server
npx --ignore-scripts=false inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

**Features available locally:**
- Full dashboard (identical to production) at `http://localhost:8288`
- Manual job triggering and step‑through execution
- Retry simulation with output inspection
- MCP (Model Context Protocol) for AI‑assisted development – connect Claude Code or Cursor for auto‑debugging and function generation

To connect your AI coding assistant to the Inngest MCP server:
```bash
claude mcp add --transport http inngest-dev http://127.0.0.1:8288/mcp
```

### 4.3 Self‑Hosted Services (Coolify)

Self‑hosted services (Authentik, Infisical, Grafana, Umami) run on Hetzner VPS instances managed by Coolify. You do **not** need to run these locally:

| Service | Cloud URL | Local Fallback |
|---|---|---|
| Authentik (Identity) | `auth.agency-domain.com` | None – must be accessible for SSO testing |
| Infisical (Secrets) | `secrets.agency-domain.com` | CLI pull to `.env.local` |
| Umami (Analytics) | `umami.agency-domain.com` | Not needed for dev |
| Grafana (Monitoring) | `grafana.agency-domain.com` | Not needed for dev |

For the booking app (deployed to Hetzner via Coolify), local development uses the same Docker Compose setup. See `apps/platform-booking/README.md`.

---

## 5. Running the Development Stack

### 5.1 Start All Services

```bash
# Start all dev servers across the monorepo
pnpm dev
```

Turborepo reads `turbo.json` and starts all packages with a `dev` task, respecting the dependency graph. Turbopack provides server fast refresh – only changed modules are re‑compiled, making iteration near‑instant.

### 5.2 Start a Specific App

```bash
# Start only the platform portal
pnpm dev --filter=platform-portal

# Start only a specific client site
pnpm dev --filter=client-acme
```

### 5.3 Verify Everything Works

Run the smoke test suite:

```bash
pnpm smoke-test
```

This performs:
- Homepage returns 200 on `localhost:3000`
- Health check `/api/health` returns 200
- Database connectivity test (PGlite ping)
- Inngest endpoint `/api/inngest` is reachable

If all four pass, your environment is correctly configured.

---

## 6. Codebase Orientation

### 6.1 Repository Structure

```
platform/
├── apps/
│   ├── clients/           ← Per‑client Next.js sites (client-acme, client-belmont, …)
│   ├── platform-portal/   ← Agency admin dashboard
│   └── platform-booking/  ← Self‑hosted booking app
├── packages/
│   ├── firm-api/          ← tRPC routers, REST route handlers
│   ├── firm-api-contracts/← Zod schemas (source of truth for all contracts)
│   ├── firm-auth/         ← Auth utilities, middleware, session hooks
│   ├── firm-ai-core/      ← LLM gateway, model routing, cost tracking
│   ├── firm-ai-brand-voice/← Per‑client brand voice profiles
│   ├── firm-ai-content/   ← Blog, social, email copy generation
│   ├── firm-ai-seo/       ← Meta descriptions, title tags, schema markup
│   ├── firm-db/           ← Drizzle schema definitions, migrations
│   ├── firm-email/        ← Email templates, provider abstraction
│   ├── firm-error-handler/← RFC 9457 error formatting
│   ├── firm-flags/        ← Feature flag definitions
│   ├── firm-forms/        ← React Hook Form + Zod components
│   ├── firm-i18n/         ← Translations, ICU messages, RTL support
│   ├── firm-seo/          ← JSON‑LD, hreflang, structured data
│   ├── firm-tokens/       ← Design tokens (DTCG → CSS/TS/Tailwind)
│   └── firm-ui/           ← shadcn/ui component library
├── infra/                 ← Infrastructure as Code (DNS, Prometheus, Grafana, Coolify)
├── docs/
│   ├── stack/             ← This documentation
│   ├── adr/               ← Architecture Decision Records
│   └── clients/           ← Per‑client runbooks and compliance docs
├── turbo.json             ← Turborepo task definitions
├── pnpm-workspace.yaml    ← pnpm workspace configuration
└── package.json           ← Root scripts and devDependencies
```

### 6.2 Key Files to Read First

1. **`docs/stack/00-overview.md`** – technology stack and core decisions
2. **`docs/stack/frontend.md`** – how Next.js and RSC are used
3. **`docs/stack/api.md`** – tRPC, REST, and contract sharing
4. **`docs/stack/database.md`** – PostgreSQL, Drizzle, RLS, and tenant isolation
5. **`docs/adr/`** – read the last 5 ADRs to understand recent architectural choices

### 6.3 Important Conventions

| Convention | Enforced By |
|---|---|
| Conventional Commits (`feat:`, `fix:`, `chore:`, …) | commitlint + Lefthook |
| Stacked PRs (200–400 lines each) | Code review culture |
| Feature flags (`release/`, `exp/`, `ops/`, `perm/`) | CI validation script |
| `'use cache'` directive with `cacheLife` profiles | Next.js 16 |
| No hardcoded strings in UI – use `@firm/i18n` | ESLint rule |
| Logical CSS properties (`ms-*`, `me-*`) instead of physical (`ml-*`, `mr-*`) | Tailwind 4.3 |

---

## 7. Your First Change

### 7.1 Pick Up an Onboarding Ticket

Look for issues labelled `good-first-issue` or `onboarding` in the repository. These are small, self‑contained tasks (1–3 hours) that touch multiple parts of the stack and are designed to familiarise you with the workflow.

### 7.2 Create a Branch

```bash
git checkout -b feat/your-initials/fix-issue-1234
```

### 7.3 Make Your Change

Use Turborepo's affected detection to only build, lint, and test what you changed:

```bash
# See what your change affects
turbo query affected --json

# Run the full quality pipeline on affected packages only
turbo typecheck lint test --filter="...[origin/main]"
```

### 7.4 Open a Pull Request

Push your branch and open a PR. CI will:

1. Lint (oxlint + ESLint)
2. Type‑check (`tsc --noEmit`)
3. Run unit & integration tests (Vitest + PGlite)
4. Run accessibility audit on affected pages
5. Run contract tests if you changed API schemas
6. Provision a Neon database branch and Vercel preview deployment
7. Run E2E tests against the preview URL

A green CI and one approving review are required to merge.

### 7.5 After Merge

The merge queue ensures your PR is tested against the latest `main` before landing. After merge, the preview environment is automatically cleaned up. Your change is deployed to production within minutes.

---

## 8. Troubleshooting

### 8.1 Common Setup Issues

| Symptom | Likely Cause | Resolution |
|---|---|---|
| `pnpm: command not found` | Corepack not enabled | Run `corepack enable` |
| `ERROR: This package requires Node.js >=22.0.0` | Wrong Node.js version | Run `volta install node@24` or verify your shell is in the project directory |
| `blockExoticSubdeps` error during `pnpm install` | A dependency uses non‑standard resolution | Report to #eng-general; do not override in `.npmrc` |
| Turbopack fails to start | Stale cache | Run `rm -rf .next .turbo && pnpm dev` |
| Inngest Dev Server can't find your app | Wrong URL or port | Confirm with `npx inngest-cli@latest dev -u http://localhost:3000/api/inngest` |
| PGlite fails to load | Node.js <22 or missing WASM support | Ensure Node.js ≥22.0 |
| Neon Local connection refused | Docker not running | Start Docker Desktop, then `docker compose up neon-local` |
| `Unable to authenticate with Infisical` | CLI not logged in | Run `infisical login` |

### 8.2 Getting Help

1. **Search existing docs:** Check `docs/stack/` and `docs/adr/` first.
2. **Ask in Slack:** `#eng-general` for technical questions, `#eng-alerts` for CI/infrastructure issues.
3. **Pair with your onboarding buddy:** They're assigned for your first two weeks and can unblock you quickly.

---

## 9. Security Reminders

> ⚠️ **Never commit secrets.** All secrets must be stored in Infisical and pulled to `.env.local`. The CI pipeline scans every commit for secrets (trufflehog).

> ⚠️ **Never bypass RLS.** All database queries must run inside a transaction with `setTenantContext()`. See [database.md](./database.md) for details.

> ⚠️ **Never disable security defaults.** pnpm's `minimumReleaseAge`, `blockExoticSubdeps`, and `allowBuilds` settings are version‑controlled and must not be overridden locally.

---

## 10. Next Steps After Week One

- [ ] Read the full [Frontend Guide](./frontend.md) and [API & Service Design](./api.md)
- [ ] Read the [CI/CD Guide](./ci-cd.md) to understand the pipeline your PR goes through
- [ ] Read the [Testing Guide](./testing.md) and write your first integration test
- [ ] Pair with a team member on a client onboarding to see the full lifecycle
- [ ] Deploy a change to production (your second or third PR)
- [ ] Review the [Governance & Cost Management](./governance-costs.md) guide to understand financial controls

---

*Related: [frontend.md](./frontend.md), [database.md](./database.md), [api.md](./api.md), [ci-cd.md](./ci-cd.md), [testing.md](./testing.md), [tenant-resolution.md](./tenant-resolution.md), [infrastructure.md](./infrastructure.md)*
# CI/CD – How We Build, Test, and Ship Code

This guide covers our continuous integration and delivery pipeline, built on GitHub Actions with affected detection, remote caching, SLSA provenance, and automated dependency updates. For platform comparisons, see the archived research.

---

## 1. Pipeline Overview

CI is orchestrated via **GitHub Actions** with Turborepo’s affected detection to run only the jobs that matter for a change. The main stages are:

1. **Validate (all PRs):** Lint, type‑check, unit/integration tests, security scan, accessibility check, dependency audit, dead code detection.
2. **Build:** Affected packages and apps, bundle analysis, SBOM generation.
3. **Preview (PRs):** Provision database branch, deploy preview, run E2E tests.
4. **Deploy (main):** Build artifacts with SLSA attestation, deploy to production.
5. **Nightly:** Full vulnerability scans, Renovate PRs, backup verification.

---

## 2. Affected Detection & Caching

We never build or test unchanged code.

- `turbo run <task> --filter="...[origin/main]"` builds only packages affected by the PR plus their downstream dependents.
- Content‑only changes (blog updates, CMS edits) use a separate `content:build` task that **does not** bust the code build cache.
- Remote caching (Vercel Remote Cache, free for connected repos) shares task outputs across the team and CI, maintaining an >80% cache hit rate.

---

## 3. Security Hardening

### Immutable Action Pins
Every third‑party action is pinned to a **full commit SHA**, never a mutable tag:

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683   # v4
```

CI runs `scripts/check-gha-shas.ts` to block unpinned tags.

### SLSA Provenance & SBOM
- Production builds generate **SLSA Level 3 provenance** via `actions/attest-build-provenance@v3`.
- An SBOM (CycloneDX) is generated via `pnpm sbom` and attached to every build artifact.
- Provenance is verified **as a gate** before staging or production promotion.

### OIDC Trusted Publishers
All deployments authenticate using short‑lived OIDC tokens to Vercel, Cloudflare, and Infisical — no long‑lived secrets stored in GitHub.

---

## 4. Code Quality Gates (CI Enforcement)

Every PR must pass:

| Gate | Tool / Command |
|------|----------------|
| Type safety | `turbo typecheck --filter="...[origin/main]"` |
| Lint (fast) | `oxlint .` |
| Lint (full, typed) | `turbo lint --filter="...[origin/main]"` |
| Unit & integration tests | `turbo test --filter="...[origin/main]" --coverage --thresholds.80 (shared) --thresholds.70 (apps) |
| Accessibility (axe‑core) | Run on affected apps; zero critical violations |
| Dependency audit | `pnpm audit --audit-level=high` |
| Version consistency | `syncpack lint` |
| Unused dependencies | `knip` |
| RLS policies | `scripts/validate-rls-policies.ts` (if DB schema changed) |
| Feature flags | `scripts/validate-feature-flags.ts` (expired flags fail) - see [Feature Flags](./feature-flags.md) for flag management context |
| Coverage thresholds | Fail CI if coverage drops >2% from baseline; enforce 80% (shared) and 70% (apps) minimum |
| Secret scanning | `trufflehog` on push |

---

## 5. Automated Dependency Updates: Renovate

Renovate manages dependency updates, respecting pnpm workspace catalogs and `minimumReleaseAge`.

- **Patch updates:** Grouped into weekly PRs, auto‑merged after CI passes.
- **CVE security fixes:** Auto‑merged immediately after CI passes, with an additional security scan.
- **Major upgrades:** Require manual approval and an ADR if architecture is affected.
- **Action SHA updates:** Auto‑merged after verification.

Renovate’s `minimumReleaseAge` is aligned with pnpm’s (1440 minutes) to prevent PRs for packages that cannot yet be installed.

---

## 6. Preview Environments

- On PR, CI provisions a **Neon database branch** (instant copy‑on‑write).
- Migrations from the PR are run against the branch (includes data seeding if needed).
- The app is deployed to Vercel with a unique preview URL, linked to the branch.
- On PR close, Vercel preview and Neon branch are deleted automatically.

---

## 7. GitHub Actions Parallelisation

- **Matrix builds**: Use `max-parallel` in GitHub Actions matrix to limit concurrent deployments
- **Multi-client deploys**: Parallel execution with tenant isolation to prevent cross‑contamination
- **Resource limits**: Respect GitHub Actions runner limits (4 concurrent jobs per repo)

---

## 8. Commit Conventions & Branching

- **Commitlint** enforces Conventional Commits on every push.
- **Lefthook** manages pre‑commit hooks (lint‑staged, secret scanning).
- **Merge queue** ensures PRs are tested against the latest `main` before merging.
- **Stacked PRs** are used for large features: each PR targets the one below, making diffs small and reviewable (200‑400 lines each). Only standard merge commits are used for intermediate PRs.

---

## 8. Emergency Deploy Path

If CI is unavailable, a documented “break glass” emergency deploy path exists: manual local build, push, and deploy via CLI. It is tested quarterly.

---

*Related: [deployment.md](../infrastructure/deployment.md), [infrastructure.md](../infrastructure/infrastructure.md), [governance-costs.md](../operations/governance-costs.md)*
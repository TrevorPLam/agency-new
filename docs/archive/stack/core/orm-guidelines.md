# ORM Guidelines – When to Use Drizzle vs Prisma

**Last updated: May 2026**  
*This document defines the official policy for ORM usage in this monorepo.*

---

## 1. Default Policy

**Drizzle ORM is the default for all applications in this monorepo.**

Prisma is allowed only when its specific tooling provides demonstrable value that outweighs the bundle-size cost. Any package that imports Prisma must document the specific rationale in its README and be approved by the architecture team.

---

## 2. Decision Criteria for Choosing Prisma

A package may use Prisma **only if** it meets **at least one** of these criteria:

### 2.1 Prisma Studio Requirement
- The feature requires Prisma Studio for non-technical data exploration
- AND the package is deployed to Vercel (not Cloudflare Workers)

### 2.2 Complex Migration Scenarios
- The migration scenario involves complex operations that `drizzle-kit` cannot express declaratively:
  - Table inheritance
  - Composite types
  - Database triggers with complex logic
  - Multi-step data transformations

### 2.3 External Dependencies
- An existing integration or dependency requires the Prisma client
- Migration to Drizzle would require significant refactoring with minimal benefit

---

## 3. Bundle Size Considerations

| Metric | Drizzle | Prisma 7 |
|---|---|---|
| Runtime footprint | ~7.4 KB (pure TypeScript) | ~1.6 MB (WASM engine) |
| Cold start (serverless) | Negligible | Measurable but acceptable |
| Edge runtime | Native (Cloudflare Workers, D1, Turso, Neon) | Natively supported since v7 |

**Impact:** For edge and serverless deployments where cold-start latency and bundle size are critical, Drizzle is the unambiguous winner.

---

## 4. Approval Process

1. **Document Rationale:** Add a section to the package's README explaining why Prisma is required
2. **Architecture Review:** Submit a PR for architecture team approval
3. **Code Review:** Ensure Prisma usage follows security and performance best practices
4. **Monitoring:** Track bundle size impact in CI/CD pipeline

---

## 5. Migration Strategy

### From Prisma to Drizzle
1. **Schema Conversion:** Use automated tools where possible
2. **Migration Rewrite:** Convert Prisma migrations to Drizzle format
3. **Testing:** Ensure all queries work identically
4. **Bundle Verification:** Confirm size reduction meets expectations

### From Drizzle to Prisma
Only allowed with explicit architecture team approval and documented business justification.

---

## 6. Enforcement

- CI/CD pipeline validates that Prisma usage follows these guidelines
- Bundle size monitoring flags packages exceeding thresholds
- Quarterly audits identify packages that could migrate to Drizzle

---

*Related: [database.md](./database.md)*

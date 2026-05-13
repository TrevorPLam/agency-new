# Firm Platform — Synthesis

**TypeScript Monorepo** | 261 files | 18 packages + 1 app  
**Build:** tsup (ESM/CJS/.d.ts) | **Test:** Vitest  
**Architecture:** Strict 4-layer dependency hierarchy enforced by `eslint-plugin-boundaries`.  
**Theme:** Multi-tenancy by default; defense-in-depth security; full observability; contract-first domain design.

---

## Layer Dependency Pyramid (bottom → top)

```
   apps/firm-platform  (consumes all layers)
          ↑
   [Layer 4 — Domain]       auth, api-contracts, consent, observability, validators
          ↑
   [Layer 3 — Infrastructure] env, cache, db, health, security
          ↑
   [Layer 2 — Foundation]   utils, crypto, errors, types, logger
          ↑
   [Layer 1 — Config]       config-eslint, config-next, config-tailwind, config-typescript
```

- No package can import from a higher layer; enforced by `eslint-plugin-boundaries` rules in `firm/config-eslint`.
- All packages export ESM + CJS + TypeScript declarations via tsup.

---

## Layer 1 — Config (zero `firm/*` deps)

### `firm/config-eslint`
- `createConfig(flags)` assembles flat-config presets: `typescript` (@typescript-eslint), `react`, `nextjs`, `boundaries` (eslint-plugin-boundaries), `imports` (perfectionist).
- Boundaries preset names all 14 layers + enforces one-way import allowlist.
- Exports: `defaultConfig`, `reactConfig`, `nextjsConfig`, `serviceConfig`.

### `firm/config-next`
- `createNextConfig(options)` → production Next.js config wrapper.
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-XSS-Protection`, CSP (w/ nonce), HSTS.
- Turbopack + `@svgr/webpack` SVG loader; cache profiles (api/page/static); SRI; optimized package imports for `lucide-react`, `date-fns`.
- Template file: `next.config.template.js` for new apps.

### `firm/config-tailwind`
- `safelist`: ~3,000 dynamic class patterns (spacing 0–99, 9 shades × 8 base colors × 4 prefixes, opacity, z-index, grid, flex, gap, rounded).
- `content`: glob array for file scanning.
- Apps spread both into `tailwind.config.js` to prevent purge of runtime-generated classes.

### `firm/config-typescript`
- Four factories:  
  `createTsConfig()` – base: ES2022, Bundler resolution, `verbatimModuleSyntax`, `isolatedDeclarations`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`.  
  `createAppConfig()` – Next.js: DOM lib, JSX Preserve, incremental, noEmit.  
  `createServiceConfig()` – Node.js services: outDir, rootDir, composite, sourceMap.  
  `createSharedLibraryConfig()` – packages: composite, declarationMap.  
- Every `tsconfig.json` calls one of these.

---

## Layer 2 — Foundation (pure logic, no I/O)

### `firm/utils`
- **`Result<T,E>`**: Ok/Err monad with `map`, `flatMap`, `mapErr`, `unwrapOr`, `unwrap`, `intoEither`.  
- **`tryCatch`/`tryCatchAsync`/`tryCatchWith`**: wraps throwing functions → `Result`.  
- **`deepMerge`/`deepMergeMany`/`applyUpdates`**: recursive merge, arrays replaced.  
- **`assertNever`/`assertNeverWithContext`**: exhaustive switch guard.  
- **String utils**: `slugify`, `hashIp` (validates IPv4/IPv6, salted SHA-256), `hashString` (SHA-256/512/MD5), `truncate`, `capitalize`, `toCamelCase`, `toPascalCase`, `toSnakeCase`.

### `firm/crypto`
- **keys.ts**: `generateApiKey` (32-byte hex), `hashApiKey` (SHA-256 hex for storage), `generateNonce`, `generateSessionToken` (32B base64url), `generateResetToken`, `generateUUID` (custom v4), `generateRandomString`.
- **hmac.ts**: `createHmac` (SHA-256/512), `verifyHmac` & `constantTimeEquals` use `crypto.timingSafeEqual`.
- **totp.ts**: `generateTotpSecret`, `generateTotpToken`, `verifyTotpToken` (wraps `otplib`).

### `firm/errors`
- RFC 9457 Problem Details error hierarchy; abstract `FirmError` with `code, status, category, context, timestamp, requestId, cause` → `toProblemDetails()` emits `{type, title, detail, status, instance, timestamp, extensions}`.
- 7 categories, 22 concrete subclasses:
  - **400**: `ValidationError`, `InvalidInputError`, `MissingRequiredFieldError`, `InvalidFormatError`, `ConstraintViolationError`
  - **401**: `AuthenticationError`, `InvalidCredentialsError`, `TokenExpiredError`, `TokenInvalidError`, `SessionExpiredError`, `MFARequiredError`, `MFAInvalidError`
  - **403**: `AuthorizationError`, `InsufficientPermissionsError`, `CrossTenantAccessError`, `ResourceAccessDeniedError`
  - **404**: `NotFoundError`, `UserNotFoundError`, `TenantNotFoundError`, `ResourceNotFoundError`
  - **429**: `RateLimitExceededError`, `QuotaExceededError`, `ConcurrentLimitExceededError`
  - **500**: `InternalServerError`, `DatabaseConnectionError`, `ConfigValidationError`, `WebhookSignatureError`, `AiQuotaExceededError`
  - **422**: `ConsentRequiredError`, `ConsentWithdrawnError`, `PaymentFailedError`, `PaymentDeclinedError`, `IntegrationFailedError`
- Helpers: `isFirmError`, `getErrorCode`, `getErrorStatus`.

### `firm/types`
- **branded.ts**: 15 nominal ID types (`TenantId`, `UserId`, `LeadId`, `CampaignId`, `BookingId`, `InvoiceId`, `SubscriptionId`, `EmailTemplateId`, `FormId`, `WebhookId`, `ApiKeyId`, `SessionId`, `AuditLogId`, `SyncJobId`, `ReportId`) with `as*Id()` (UUIDv4 validated) and `is*Id()` guards.
- **enums.ts**: 30+ string union types (`TenantStatus`, `UserStatus`, `LeadStatus`, `CampaignType`, `BookingStatus`, `ServiceTier`, `PermissionCategory`, `Currency`, `Language`, `Timezone`…).
- **entities.ts**: DDD interfaces (`BaseEntity` → `TenantScopedEntity` → `AuditableEntity` → domain entities: `Tenant`, `User`, `Lead`, `Campaign`, `Booking`, `Invoice`, `Subscription`, `EmailTemplate`, `Form`, `Webhook`, `ApiKey`, `Session`, `AuditLog`, `SyncJob`, `Report`).
- **adapters.ts**: `BaseAdapter`, `CRMAdapter`, `EmailAdapter` interfaces (targeting GoHighLevel, HubSpot, Salesforce, Pipedrive, Zoho, Resend, SendGrid, SES, SMTP).
- **helpers.ts**: `DeepPartial`, `RequiredDeep`, `NonNullableDeep`, `PickDeep`, `OmitDeep`, `Unbranded<T>`, `CreateEntity<T>`, `UpdateEntity<T>`, case transformers (`CamelCase<T>`, `SnakeCase<T>`), HTTP/pagination types.

### `firm/logger`
- Built on Pino; `getLogger(name?)` → `ContextualLogger` scoped to component.
- `runWithContext` / `runWithContextAsync` bind `AsyncLocalStorage` context (`correlationId`, `tenantId`, `userId`, `requestId`, `traceId`) to all log calls within execution scope.
- `createRedactionSerializer(fields)` → Pino serializer redacts named fields.
- Levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

---

## Layer 3 — Infrastructure (touches external systems)

### `firm/env`
- `@t3-oss/env-nextjs` + Zod; 4 modules aggregated into `envConfig`.
- **database.ts**: `DATABASE_URL` (req), `DATABASE_READ_REPLICA_URL`, `DATABASE_POOL_SIZE` (10), `DATABASE_TIMEOUT_SECONDS` (30), `DATABASE_SSL_ENABLED` (true), `DATABASE_SCHEMA`.
- **redis.ts**: `REDIS_URL` (protocol `redis`/`rediss`), DB 0–15, timeout, retries, `KEY_PREFIX`, `DEFAULT_TTL_SECONDS`, `CLUSTER_ENABLED`, `CLUSTER_NODES`.
- **auth.ts**: `AUTH_SECRET` (≥32 chars), `AUTH_URL` (HTTPS enforced), session timeout, max concurrent sessions, MFA toggle, TOTP issuer, OAuth (Google/GitHub/Microsoft), SAML IdP/SP config, API key secret, impersonation flag, rate limit params; `NEXT_PUBLIC_*` browser variants.
- **platform.ts**: `NODE_ENV`, `APP_VERSION` (semver), `PLATFORM_REGION`, `INSTANCE_ID`, debug/log level, OTel endpoint+svc name, feature flags endpoint+SDK key, webhook secret+timeout, job queue provider, email provider+key+from, storage provider+bucket+region+credentials, AI provider+model+key+rate limit; `NEXT_PUBLIC_*` (Sentry DSN, analytics ID).
- Validation on import; `validateEnvironment()` explicit call available.

### `firm/cache`
- Tenant-isolated Redis (`ioredis`) with `TenantCache` (keys: `tenant:{tenantId}:{key}`).
- `get<T>()` returns `null` on JSON parse failure (type confusion guard).
- Methods: `get`, `set`, `setex`, `del`, `keys`, `exists`, `expire`, `ttl`, `incr`, `decr`, set ops (`sadd`, `srem`, `sismember`, `smembers`), sorted set ops (`zadd`, `zrange`), `pipeline()`.
- `TagManager`: associate keys with tags via Redis Sets; `invalidateTag(tag)` deletes all associated keys atomically.
- `KeyFactory`: structured builders (`forUser`, `forLead`, `forTenant`, `forSession`…) prevent collisions.
- `TTLPolicies`: 16 named constants:  
  `USER_SESSION` 30m, `TEMPORARY_DATA` 5m, `USER_PREFERENCES` 7d, `CONFIGURATION` 30d, `STATIC_DATA` 90d, `RATE_LIMIT` 1m, `FORM_DATA` 2h, `LEAD_DATA` 2w, `EMAIL_DATA` 7d, `BOOKING_DATA` 3d, `API_RESPONSE` 15m, `FEATURE_FLAG` 10m, `ANALYTICS_DATA` 2d, `SECURITY_DATA` 5m, `CACHE_WARMING` 24h.

### `firm/db`
- Drizzle ORM + PostgreSQL; 12 tables: `tenants`, `users`, `leads`, `forms`, `bookings`, `campaigns`, `email`, `crm_sync_jobs`, `auth_sessions`, `mfa`, `audit_logs`, `outbox_events`.
- **Soft deletes**: `tenants`, `users`, `leads`, `forms` have `deletedAt`; `cursorPaginate()`/`getCount()` filter soft-deleted by default (`includeDeleted` escape hatch).
- **RLS**: PostgreSQL policies gated on `app.current_tenant_id`; `setTenantContext(db, tenantId)` / `clearTenantContext(db)` helpers.
- **Transactional Outbox**: `outbox_events` table; events written atomically in business transactions, polled later → at-least-once publishing.
- **Cursor pagination**: Base64-encoded `{id, updatedAt}` cursors.
- **Test harness**: PGlite (in-process PG) + real migrations; `factories.ts` provides `createTestTenant`, `createTestUser`, setup/teardown.

### `firm/health`
- `createHealthHandler(options)` → bearer-token-secured async handler; Express (`expressHealthMiddleware`) & Next.js (`nextHealthHandler`) adapters.
- 5 probes run in parallel:
  - **Liveness**: event loop responsiveness via `setImmediate`; >50ms → degraded.
  - **Readiness**: registered `HealthCheck` functions with timeouts; `readinessProbeWithRLS()` auto-includes RLS check.
  - **Startup**: tracks `markBootstrapped()` after init.
  - **RLS Check**: queries DB to verify RLS policies active.
  - **Synthetic**: `SyntheticCheckManager` registry for end-to-end smoke tests.
- Response: 200 healthy, 503 degraded/unhealthy.

### `firm/security`
- **CSRF**: `CsrfTokenManager` — HMAC double-submit pattern with session binding; token format `{token}.{expires}.{signature}`; `generateToken(sessionId)`, `parseTokenString` (validates signature, expiry, session binding atomically).
- **CSP Hashing**: `generateCspHash` (sha256-{base64}), `CspHashBuilder`.
- **CSP Nonces**: `generateCspNonce` (16-byte base64 per request), `createCspNonceContext`.

---

## Layer 4 — Domain (composes all lower layers)

### `firm/api-contracts`
- **Shared API surface** — single source of truth.
- **Event System** (CloudEvents 1.0): `BaseEventSchema` with extensions (`tenantId`, `correlationId`, `causationId`, `version`).  
  `defineEvent(type, schema)` → `EventDefinition<TData>`, registered in `EVENTREGISTRY`.  
  `createTypedEvent` validates data, generates UUID → typed event.  
  19 domain events across 4 domains:  
  - Booking: created, updated, confirmed, cancelled, reminder-sent  
  - CRM: lead.created, lead.updated, lead.synced, lead.converted  
  - Email: sent, delivered, bounced, opened, clicked  
  - Forms: submitted, validation-failed  
- **tRPC Contracts**: `LeadRoutes`, `FormRoutes`, `BookingRoutes` as `TRPCRouterRecord` with Zod input/output → `AppRouter` for end-to-end type safety.
- **OpenAPI Contracts**: REST routes via `@asteasolutions/zod-to-openapi`; `generateOpenAPIDocument()` → OpenAPI 3.1.0 spec (servers: prod/staging/dev). CI script (`check-openapi-changes.ts`) uses `oasdiff` to block breaking changes.

### `firm/auth`
- **Authentication**: `authenticateRequest()` unifies cookie + Bearer token auth.
- **Sessions**: all `SessionContext` objects deeply `Object.freeze()`’d (including permissions array) — prevents runtime privilege escalation.  
  Functions: `createSession`, `createImpersonatedSession`, `createDelegatedSession`, `verifySession`, `revokeSession`, `revokeExpiredSessions`, `refreshSession`, `extendSession`, `getActiveSessionCount`.
- **RBAC**: `PERMISSION_MATRIX` for 6 roles (superadmin, tenantadmin, manager, agent, user, readonly).  
  `SUPERIOR_ROLE_MAP` for hierarchy. `hasPermission()` → `PermissionCheckResult`; `requirePermission()` throws `PermissionError`.
- **API Keys**: Format `firm_{32-char-alphanumeric}`; HMAC-SHA-256 hashed against `API_KEY_HMAC_SECRET`; constant-time verify (`crypto.timingSafeEqual`). Keys carry `permissions`, `expiresAt`, `allowedIpAddresses`, `allowedUserAgents`, `rateLimitPerHour`.
- **MFA/TOTP**: `setupTotp` (160-bit base32 secret, QR code via `qrcode`, 10 backup codes Argon2id-hashed). `verifyTotpSetup` activates. Lifecycle: `disableTotp`, `regenerateBackupCodes`.
- **Impersonation**: `startImpersonation` re-verifies impersonator’s session fresh from DB (TOCTOU fix). Audit record created on fresh verification.
- **Delegation**: `grantDelegation` time-limited permission subsets; `canDelegate` enforces hierarchy (no upward delegation).
- **Rate Limiting**: `RedisRateLimiter` uses `TenantCache.incr()+expire()` (atomic sliding window); fails open on Redis errors. Configs: `API_KEY` (1000/hr, 5m block), `MFA_TOTP` (5/5m, 15m block), `MFA_BACKUP_CODE` (3/5m, 15m block), `STRICT` (10/min, 5m block).
- **Audit Logging**: `createAuditLog`, `logAuthenticationEvent`, `logAuthorizationEvent`, `logSecurityEvent` → immutable records; `verifyAuditLogIntegrity`, `detectAnomalousActivity`, `getHighRiskEvents`.

### `firm/consent`
- GDPR: 5 categories (`necessary`, `analytics`, `marketing`, `functional`, `preferences`).
- `ConsentManager` generates HMAC-signed cookie payloads.
- GPC: `Sec-GPC: 1` header forces all non-necessary categories to `false`.
- Server-side helpers: `getConsentFromHeaders`, `hasConsentFromHeaders`, `isGpcEnabledFromHeaders`, `applyGpcOverrides` → SSR-safe consent resolution.
- `buildConsentCookieHeader` → `Set-Cookie` with `Secure; SameSite=Lax; Path=/`.
- React `<ConsentGate>` component for client-side conditional rendering.

### `firm/observability`
- `initializeObservability(config)` boots OTel SDK (OTLP HTTP exporter) + Sentry SDK (PII scrubbing).
- `withSpan`/`withAsyncSpan` wrap function in trace span; traceId/spanId injected into Pino logs.
- `platformMetrics` exposes pre-built instruments:  
  Counters: `httpRequestsTotal`, `cacheHits`, `cacheMisses`, `customOperations`.  
  Histograms: `httpRequestDuration`, `dbQueryDuration`, `queueProcessingDuration`.  
  UpDownCounter: `activeConnections`.  
  Observable Gauges: `memoryUsage`, `cpuUsage`.
- `captureException` sends to Sentry after PII redaction.
- `PiiRedactionProcessor` (OTel span processor) scrubs email, phone, SSN, credit card, address patterns from span attributes before export.
- Express/Next.js middleware: `TracingMiddleware`, `MetricsMiddleware` auto-instrument HTTP.

### `firm/validators`
- Zod schemas for all domain entities.
- `common.ts`: 30+ reusable primitives: `uuidField`, `emailField` (RFC 5322), `phoneField` (E.164), `urlField`, `slugField` (3–50 chars, lowercase alphanumeric + hyphens, no consecutive), `nameField`, `textField(min,max)`, `numberField`, `booleanField`, `timestampField`, `metadataField`, `customFieldsField`; branded ID fields; pagination, sorting, address, money, file schemas.
- Entity schemas:
  - `lead v1` (baseline with notes/activities)
  - `lead v2` (extends v1: consent tracking, enrichment data, score factors, conversion probability; migration function `migrateLeadV1ToV2`)
  - `tenant` (service-tier limit enforcement: starter ≤5 users/1k leads, enterprise ≤1k users/1m leads)
  - `user` (role-to-permissions auto-derivation, notification preference defaults)
  - `campaign`: 7 types (email, sms, social, webinar, event, content, retargeting) with audience/schedule/content/performance sub-schemas; business rules: email needs subject, SMS ≤1600 chars, schedule future+≤1 year, attachments ≤25MB total.
- Each has a `*WithValidation` variant (cross-field rules via `superRefine`), a `safeParse` export, and a `satisfies` compile-time assertion against `firm/types` entity interfaces.

---

## Application Layer (`apps/`)
- Only **Next.js observability demo** exists.
- API route `/api/test-observability` exercises OTel spans, structured logging, Sentry, custom metrics.
- Client page `ObservabilityDemo` shows live logs/traces.
- `instrumentation.ts` uses Next.js 16 Instrumentation Hook to init observability.
- `next.config.js` template wired with `firm/config-next`.

---

## Security Architecture Summary
- **Timing attacks**: `constantTimeEquals`, `verifyHmac` use `crypto.timingSafeEqual`; dummy comparisons when no valid candidate.
- **Session immutability**: deep `Object.freeze()` including permissions array.
- **TOCTOU impersonation**: re-verifies session from DB immediately before granting.
- **RLS**: enforced at PostgreSQL engine level; every query runs under tenant context.
- **PII redaction**: emails, phones, SSNs, credit cards, addresses scrubbed from logs, error reports, span attributes before export.
- **CSRF**: HMAC double-submit, session-bound, expiring tokens.
- **CSP**: nonces, hashes, headers applied globally via Next.js config.
- **Rate limiting**: Redis-backed, fails open.
- **API keys**: HMAC-SHA-256 hashed, constant-time verified, scoped permissions, IP/UA allowlists, per-key rate limits.
- **Audit**: all sensitive operations emit tamper-evident logs; integrity verification.

---

## Testing Strategy
- **Vitest** across all packages.
- **Unit tests** co-located with source (`*.test.ts`).
- **Integration tests**: use PGlite for in-process PostgreSQL with full migrations; `createTestEnvironment()` provides tenant+user+cleanup.
- **Compile-time tests**: TypeScript type assertions (`tsc --noEmit`); `firm/types` has 29 type relationships checked at build time.
- **Security tests**: dedicated suites for timing attacks, session immutability, TOCTOU, JSON parse safety, permission escalation.
- **Snapshot tests**: design token output locked against regression.

---

## What's Complete vs. Missing
### Complete
- Entire infrastructure layer: authentication, authorization, rate limiting, RBAC, MFA, impersonation, delegation, audit logs, consent management, caching, DB with RLS, health checks, security primitives, observability stack.
- All domain contracts: event system (19 events), tRPC routes (Leads, Forms, Bookings), OpenAPI 3.1 spec with CI breaking-change detection.
- Canonical types (15 branded IDs, 30+ enums, full entity interfaces, adapter interfaces).
- Validation schemas with business rules for leads, tenants, users, campaigns.
- Config factories for ESLint, Next.js, Tailwind, TypeScript.
- Design token pipeline (Style Dictionary) with output tests.

### Missing (fully specified, not implemented)
- **CRM adapter implementations** (GoHighLevel, HubSpot, Salesforce, Pipedrive, Zoho).
- **Email sending service** (`firm/email` package not present, though contracts exist).
- **Campaign execution engine** (DB schema + validators ready, no service layer).
- **Webhook inbound handler** (env config exists, handler not implemented).
- **Primary Next.js application shell** (only a demo app exists; main agency UI/API not scaffolded).
- **Feature flags provider integration** (env vars wired, no SDK integration).

---

## Dependency Graph (Simplified)
```
  apps/firm-platform
     ↖              ↑
  [Domain]  auth, api-contracts, consent, observability, validators
     ↑
[Infrastructure] env, cache, db, health, security
     ↑
 [Foundation] utils, crypto, errors, types, logger
     ↑
   [Config] config-eslint, config-next, config-tailwind, config-typescript
```

---

## Key Metrics
- Files: 261
- Packages: 18 shared + 1 app
- Events: 19 domain events (4 domains)
- Roles: 6, with permission matrix
- Error classes: 22 across 7 categories
- Branded IDs: 15
- Enums: 30+
- Health probes: 5
- Redis TTL policies: 16 named constants
- Tailwind safelist patterns: ~3,000

---

**Final Note:** Firm is a production-grade, security-hardened, multi-tenant SaaS infrastructure foundation. All domain contracts, database schemas, validation rules, and cross-cutting concerns are fully specified. The remaining work consists of building the concrete business services (CRM adapters, email engine, campaign logic) and the primary application UI—all within a rigidly enforced, layered architecture that guarantees isolation, type safety, and observability from the first line of code.
# Email – How We Send and Manage Email in This Monorepo

This guide covers our email provider, template system, multi‑brand governance, deliverability, and compliance. For alternative providers, see the archived research.

---

## 1. Provider: Resend (Primary) + SMTP Fallback

We use **Resend** as the primary email provider for all transactional, notification, and marketing emails.

- Permanent free tier: 3,000 emails/month (100/day).
- Paid plans from $20/month for 50K emails.
- Broadcasting API for marketing sends.
- Automatic SPF/DKIM setup.

**Fallback:** If Resend is unreachable, `@firm/email` automatically retries via **NodeMailer (SMTP)** using client's own SMTP credentials. Client SMTP credentials are stored in Infisical with automatic rotation. Fallback behaviour: if credentials are missing, fail open with alert and notify account manager.

---

## 2. Shared Email Package (`@firm/email`)

All email sending is centralized through a single package. Business logic never calls Resend or NodeMailer directly.

```typescript
import { sendTransactional, sendNotification, sendMarketing } from '@firm/email';

await sendTransactional({ to, template: 'welcome', props: { name } });
```

### Provider Abstraction
The package resolves the provider at runtime. On transient failure (timeout, 5xx), it retries with the fallback. Permanent errors (invalid address) are returned to the caller.

---

## 3. Template System: React Email 6.0

All email templates are built as React components and rendered to email‑safe HTML.

- Import components from a single `react-email` package (v6 unifies the ecosystem).
- Templates live in `packages/email/templates/` and are versioned.
- The embeddable editor (`@react-email/editor`) allows non‑technical users to compose simple emails in the agency’s admin portal.

### Template Structure
```
packages/email/templates/
├── transactional/
│   ├── welcome.tsx
│   ├── password-reset.tsx
│   └── form-confirmation.tsx
├── notification/
│   └── new-lead.tsx
└── marketing/
    └── newsletter.tsx
```

---

## 4. Multi‑Brand Email Template Governance

We separate **brand definition** from **template design**.

- Brand assets (colors, logos, fonts) are defined once in `@firm/tokens`.
- `@firm/email` reads these tokens and applies them to base templates.
- A client brand change in `@firm/tokens` propagates to all email templates automatically — no duplication, no per‑client code branches.

---

## 5. Deliverability

### Domain Authentication
Every client’s sender domain is configured with SPF, DKIM, and DMARC via DNSControl. DMARC is enforced at `p=quarantine` or `p=reject` per Google/Yahoo requirements for bulk senders.

### Domain Warmup
New sender domains are warmed up using **MailReach** ($25/inbox/month) before full volume. This protects sender reputation.

### Bounce Handling Policy
- **Hard bounces**: Auto‑suppression after 3 consecutive hard bounces
- **Soft bounces**: Retry up to 3 times, then suppress
- **Suppression management**: Suppressed addresses are removed from all future sends and flagged in dashboard
- **Recovery**: Manual review required to re-enable suppressed addresses
Per‑client dashboards in Grafana track:
- Blacklist status (Spamhaus, Barracuda)
- Inbox placement rate (seed‑list testing)
- Spam complaint rate (must stay <0.30% for Google/Yahoo compliance)
- **Automated action**: When spam complaint rate exceeds 0.30%, automatically pause all sending and page on‑call engineer
- **Recovery process**: Manual investigation required, address list cleanup, and gradual send resumption
- DMARC aggregate pass/fail percentages

---

## 6. Email Consent & Compliance

### CNIL Email Tracking Pixel Ruling (France)

**Legal Framework:** CNIL Délibération n° 2026‑042 (effective 14 April 2026) requires prior, specific, and separate consent for email tracking pixels sent to French recipients. **Compliance deadline: 15 juillet 2026** for legacy data.

**Core Requirements:**
- **Prior consent** required before embedding tracking pixels
- **Separate consent** from email marketing consent  
- **Granular options** for different tracking purposes
- **Territory detection** for French recipients
- **Consent withdrawal** mechanism in every tracked email

#### Implementation Status
`@firm/email` automatically disables tracking pixels for non‑consented EU recipients and implements territory‑based consent logic. All transactional emails honour `consent.emailTracking` flag from user profile.

#### Consent Categories Requiring Separate Approval
| Use Case | Description | Consent Required |
|---|---|---|
| Campaign performance analysis | Measuring open rates to optimise frequency, content, or channel selection | ✅ |
| Recipient profiling | Building interest‑based profiles for targeting users outside email | ✅ |
| Fraud detection (marketing‑side) | Detecting automated or unusual open behaviour | ✅ |
| Deliverability tracking beyond hygiene | Using open‑rate data for segmentation, personalisation, or optimisation | ✅ |
| Personalisation | Tailoring content based on tracked behaviour | ✅ |

#### Exempt Uses (Narrow Exceptions)
| Use Case | Conditions |
|---|---|
| Security / authentication | Verifying login or account‑verification email was opened by intended recipient | ✅ |
| Deliverability "hygiene" | Adjusting sending frequency or stopping emails to inactive recipients (date only, not time) | ✅ |
| Legal compliance | Demonstrating legally required information was delivered | ✅ |

### Marketing Emails
- **Consent‑gated** — `sendMarketing()` silently drops if consent is missing.
- **One‑click unsubscribe** (RFC 8058) with `List-Unsubscribe` header is mandatory.
- **Spam complaint rate** must stay under 0.30%.
- **CNIL compliance** — French recipients require granular email tracking consent.

### Transactional & Notification Emails
These do not require marketing consent. However, **tracking pixels in these emails still require separate consent per CNIL rules for French recipients**.

### Consent Capture & Storage
Consent must be captured at **email address collection time** via `@firm/forms` and stored with:
- `consentedAt` timestamp for expiry tracking
- `consent.emailTracking` boolean flag for CNIL pixel compliance
- Granular flags for each tracking purpose
- Separate from marketing consent field
- Audit trail for all consent changes
- Integration with `@firm/tokens` for dynamic brand assets and theme propagation

### Operational Monitoring
- **Grafana dashboard:** "FR recipients — pixel consent rate" with alerts on consent rate drops
- **Weekly audit script:** Verifies consent consistency between stored records and email dispatch
- **Consent expiry tracking:** Flag records approaching 6‑month renewal interval

**Full implementation details:** See [CNIL Email Tracking Pixel Compliance](../features/cnil-email-pixels.md)

---

## 7. Delivery Monitoring

Resend webhooks notify the platform of delivery events (sent, delivered, opened, bounced, complained). These are processed by a webhook handler and fed into:

- Grafana per‑client delivery dashboards.
- Alerts if bounce rate exceeds threshold or complaint rate approaches acceptable limits.

---

*Related: [forms.md](../features/forms.md), [background-jobs.md](./background-jobs.md), [infrastructure.md](../infrastructure/infrastructure.md), [governance-costs.md](../operations/governance-costs.md)*
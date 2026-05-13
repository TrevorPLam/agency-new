# Forms & Lead Capture – How We Build Forms in This Monorepo

This guide covers our form architecture, validation, spam protection, multi‑tenant storage, and CRM integration. For form library comparisons, see the archived research.

---

## 1. Form Lifecycle

Every form submission follows a consistent path:

1. **Definition** – Schema defined as a Zod v4 schema in `@firm/api-contracts`.
2. **Rendering** – `<Form schema={schema}>` from `@firm/forms` renders accessible, themed fields.
3. **Client Validation** – React Hook Form 7.71 + Zod, validates on blur and submit.
4. **Submission** – Data POSTed to a Server Action or API route.
5. **Server Validation** – The same Zod schema re‑validates (never trust client validation). Spam checks and rate limiting applied.
6. **Storage** – Submission written to the tenant‑isolated database.
7. **Background Processing** – Inngest `form.submitted` event dispatched. Handlers: CRM sync, email confirmation, analytics.

---

## 2. Shared Form Package (`@firm/forms`)

All forms are built with a single shared package.

### Stack
- **React Hook Form 7.71** – uncontrolled components, minimal re‑renders (~9KB gzipped).
- **Zod v4** – schema validation, 3× faster than v3, `z.interface()` for large objects.
- **React 19 primitives** – `useActionState` for pending states, `useFormStatus` for context.

### Usage Example
```tsx
import { Form } from '@firm/forms';
import { contactFormSchema } from '@firm/api-contracts';

function ContactPage() {
  return (
    <Form
      schema={contactFormSchema}
      action="/api/forms/contact"
      onSuccess={() => track('generate_lead', { source: 'contact_form' })}
    />
  );
}
```

---

## 8. Email Tracking Consent (CNIL Compliance)

### CNIL Délibération n° 2026‑042 Requirements

For French recipients, **email tracking pixels require prior, specific, and separate consent** (effective 14 April 2026, compliance deadline 15 juillet 2026).

### Consent Schema Addition

```typescript
// Add to base contact/lead form schemas in @firm/api-contracts
const consentSchema = z.object({
  marketing: z.boolean(),          // existing consent to receive marketing emails
  emailTracking: z.object({
    performanceAnalytics: z.boolean(),  // pixel for campaign optimisation
    personalisation: z.boolean(),       // pixel for tailoring content
    profiling: z.boolean(),             // pixel for building interest profiles
  }).optional(),
});

// Updated contact form schema
const contactFormSchema = z.object({
  // ... existing fields ...
  marketing: z.boolean().default(false),
  emailTracking: consentSchema,
  // Add field-level encryption for sensitive PII
  ssn: z.string().transform(val => val ? encrypt(val) : undefined).optional(),
  bankAccount: z.string().transform(val => val ? encrypt(val) : undefined).optional(),
});
```

### Form Implementation

```tsx
// Contact form with CNIL compliance
function ContactPage() {
  return (
    <Form
      schema={contactFormSchema}
      action="/api/forms/contact"
      onSuccess={() => track('generate_lead', { source: 'contact_form' })}
    >
      {/* Existing marketing consent */}
      <FormField name="marketing" type="checkbox" label="I consent to receive marketing emails" />
      
      {/* NEW: Email tracking consent section */}
      <FormField name="emailTracking" type="group" legend="Email Tracking Consent">
        <FormField 
          name="performanceAnalytics" 
          type="checkbox" 
          label="I consent to email tracking for campaign performance analysis" 
        />
        <FormField 
          name="personalisation" 
          type="checkbox" 
          label="I consent to email tracking for content personalisation" 
        />
        <FormField 
          name="profiling" 
          type="checkbox" 
          label="I consent to email tracking for interest-based profiling" 
        />
      </FormField>
    </Form>
  );
}
```

### Key Requirements

- **Separate consent:** Email tracking consent must be collected separately from marketing consent
- **Granular options:** Recipients can consent to individual tracking purposes
- **Collection timing:** Consent captured at email address collection time
- **Territory detection:** Forms automatically detect French recipients and apply CNIL rules
- **Storage:** Consent flags stored with `consentedAt` timestamp for audit trail

**Implementation status:** ✅ Supported via `@firm/forms` schema extensions and conditional rendering

### Multi‑Step Wizards
Each step has its own Zod schema. Progress persists to **server‑signed cookies** for resilience and security. Final submission merges all steps into one validated payload.

---

## 3. Spam Protection Pipeline

Public‑facing forms are protected by four layers:

| Layer | Method | Purpose |
|-------|--------|---------|
| 1. Honeypot | Hidden field invisible to humans | Bots fill it; if populated, silently discard |
| 2. Turnstile | Cloudflare’s privacy‑first CAPTCHA | Verifies human without cookies; free tier supports unlimited challenges |
| 3. Rate Limiting | Arcjet v1.0 (per‑IP, per‑tenant) | Prevents flooding the endpoint |
| 4. Time‑Based Rejection | Reject if submitted <3 seconds after page load | Indicates automated bot |

The honeypot field is included automatically by `@firm/forms`. Turnstile is configured per client via environment variables.

---

## 4. Multi‑Tenant Submission Storage

Submissions contain PII and must be strictly isolated.

| Topology | Storage Method |
|----------|----------------|
| Shared schema + RLS | Single `submissions` table; RLS enforces `tenant_id = current_setting(...)` |
| Schema‑per‑tenant | `client_acme.submissions` (stronger isolation) |
| Database‑per‑tenant | Separate database (maximum isolation) |

The form backend selects the correct target based on the authenticated tenant context (from the JWT, never from the request body).

---

## 5. File Uploads in Forms

When a form includes file uploads:

1. Client‑side validation checks size and type.
2. The file is uploaded directly to Cloudflare R2 (private bucket) via a signed URL.
3. Server‑side validation verifies MIME type via magic bytes.
4. **Mandatory malware scan (ClamAV)** quarantines files before linking to submission. All uploads are scanned by default; no opt‑out available.
5. The submission record stores the file UUID, not the raw file.

---

## 6. CRM Sync Integration

After validation and storage, a background job syncs the submission to the client’s CRM:

1. Receives `form.submitted` event.
2. Looks up client’s CRM credentials from Infisical.
3. Transforms form data to the CRM’s format.
4. Calls the CRM API (GoHighLevel, HubSpot).
5. Handles failures with retry and dead‑letter queuing.
- **DLQ replay procedure**: Fix CRM credentials → manually replay failed jobs from Inngest dashboard with updated payload

`@firm/forms` passes UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`) as hidden fields to the CRM, solving the ~30% attribution gap where CRM leads lack source data.

---

## 7. Analytics & Attribution

On successful submission, `@firm/forms` emits a `generate_lead` analytics event with full UTM data. This feeds into:

- Attribution reports (behavioral truth from analytics joined with commercial truth from CRM).
- Lead scoring pipelines (demographic scoring before CRM sync, behavioral scoring in CRM).
- Closed‑loop reporting: form → pipeline → revenue.

---

*Related: [frontend.md](../core/frontend.md), [background-jobs.md](../integrations/background-jobs.md), [email.md](../integrations/email.md), [api.md](../integrations/api.md), [database.md](../core/database.md)*
# CNIL Email Tracking Pixel Compliance

**Last updated: May 2026**  
*Implementation guide for CNIL Délibération n° 2026‑042 on email tracking pixels in French territory.*

---

## 1. Legal Framework

| Element | Detail |
|---|---|
| **Authority** | Commission Nationale de l'Informatique et des Libertés (CNIL) |
| **Deliberation** | Délibération n° 2026‑042 du 12 mars 2026 |
| **Publication date** | 14 April 2026 |
| **Public consultation** | 12 juin – 24 juillet 2025 |
| **Legal basis** | Art. 82 of French Data Protection Act (transposing Art. 5(3) ePrivacy Directive 2002/58/EC) |
| **Scope** | Any invisible tracking pixel embedded in an email sent to a recipient in France |
| **Core rule** | Prior, specific, and separate consent required — independent from any consent to send email itself |
| **Timeline** | Immediate effect for new email collections; legacy databases must be compliant by **15 juillet 2026** |

The CNIL's position is that a tracking pixel triggers a "read" or "record" operation on the recipient's terminal equipment and therefore falls under the same legal regime as cookies and other trackers.

---

## 2. Consent Requirements

### 2.1 Uses That Require Prior Consent

| Use Case | Description |
|---|---|
| Campaign performance analysis | Measuring open rates to optimise frequency, content, or channel selection |
| Recipient profiling | Building interest‑based profiles for targeting users outside email (e.g., retargeting on websites, mobile apps) |
| Fraud detection (marketing‑side) | Detecting automated or unusual open behaviour for campaign analytics |
| Deliverability tracking beyond strict hygiene | Any use of open‑rate data that goes beyond clean‑up into segmentation, personalisation, or optimisation |
| Personalisation | Tailoring email content, subject lines, or offers based on tracked behaviour |

### 2.2 Uses That May Be Exempt (Narrow Exceptions)

| Use Case | Conditions |
|---|---|
| Security / authentication | Verifying that a login or account‑verification email was opened by the intended recipient |
| Deliverability "hygiene" | Adjusting sending frequency or stopping emails to inactive recipients — must be limited to strict minimum, with only date (not time) of most recent open retained |
| Legal compliance | Demonstrating that a legally or contractually required information email was delivered |

---

## 3. Implementation Architecture

### 3.1 Consent Capture Point

The CNIL recommends that consent be collected at **point of email address collection** — in sign‑up forms. The platform's `@firm/forms` package is the primary integration point.

### 3.2 Schema Requirements

```typescript
// In @firm/api-contracts - shared base contact/lead form schema
const consentSchema = z.object({
  marketing: z.boolean(),          // existing consent to receive marketing emails
  emailTracking: z.object({
    performanceAnalytics: z.boolean(),  // pixel for campaign optimisation
    personalisation: z.boolean(),       // pixel for tailoring content
    profiling: z.boolean(),             // pixel for building interest profiles
  }).optional(),
});
```

### 3.3 Form Integration Workflow

```
1. User fills contact/lead form
2. @firm/forms renders:
   - Existing "I consent to receive marketing emails" checkbox
   - NEW collapsible or second‑layer section:
     ☐ I consent to email tracking for campaign performance analysis
     ☐ I consent to email tracking for content personalisation
     ☐ I consent to email tracking for interest‑based profiling
3. On submission:
   - Consent flags stored in contact record
   - setTenantContext(...) applied before DB write
   - Inngest form.submitted event includes consent flags
```

### 3.4 Email Dispatch Logic

```typescript
// In @firm/email - sendTransactional / sendMarketing / sendNotification
async function sendEmail(recipient, template, props) {
  const consent = await db.contacts.getConsent(recipient.email);
  
  if (isEUTerritory(recipient.locale) && consent?.country === 'FR') {
    // FR: CNIL rules apply
    if (template.hasTrackingPixel && !consent.emailTracking?.performanceAnalytics) {
      sendWithoutPixel(); // disable pixel
    }
  } else if (isEUTerritory(recipient.locale) && consent?.country !== 'FR') {
    // Other EU: apply conservative approach (pixel off unless explicit consent)
    if (!consent.emailTracking?.anyPurpose) {
      sendWithoutPixel();
    }
  } else {
    // Non‑EU: current behaviour (pixel on per existing consent)
    sendWithPixel();
  }
}
```

### 3.5 Consent Withdrawal Link

Every email that carries a tracking pixel **must** include a dedicated withdrawal link in the footer that allows the recipient to revoke tracking consent without friction and without requiring them to provide their email address again.

---

## 4. Operational Requirements

### 4.1 Data Retention

Consent records must be retained for the duration of data‑processing activity and be demonstrable to CNIL on demand. This has cost implications for database storage and audit‑trail logging.

### 4.2 Monitoring

- **Grafana dashboard panel:** "Emails sent to FR recipients — pixel consent rate" (tracks what proportion of emails have valid pixel consent; alerts if a large drop occurs, indicating a form or consent‑logic regression).
- **Scheduled audit script (runs weekly):** Checks that every email sent to a French recipient in the previous week was dispatched with pixel consent flags consistent with the recipient's stored consent record. Logs discrepancies for manual review.
- **Consent expiry tracking:** The CNIL considers that consent should be renewed periodically (the cookie‑consent guideline suggests 6‑month intervals). The platform should store a `consentedAt` timestamp and flag records approaching expiry.

### 4.3 Documentation Requirements

All client forms and email templates must include clear documentation about:
- Which tracking purposes are enabled
- How consent was obtained
- Withdrawal mechanism
- Data retention periods

---

## 5. Integration Points

| Package | Responsibility | Implementation Status |
|---|---|---|
| `@firm/forms` | Consent capture UI and schema | ✅ Implemented |
| `@firm/email` | Territory‑based dispatch logic | ✅ Implemented |
| `@firm/api-contracts` | Schema definitions | ✅ Implemented |
| `@firm/db` | Consent record storage | ✅ Implemented |

---

## 6. Compliance Checklist

For any new client deployment or email campaign targeting French recipients:

- [ ] Email tracking consent captured at email address collection time
- [ ] Granular consent options available (performance analytics, personalisation, profiling)
- [ ] Consent stored separately from marketing consent
- [ ] Territory detection implemented for French recipients
- [ ] Email dispatch logic respects CNIL rules
- [ ] Consent withdrawal links included in all tracked emails
- [ ] Monitoring dashboards configured for CNIL compliance
- [ ] Audit trail enabled for consent records
- [ ] Data retention policy documented and implemented

---

*Related: [email.md](../integrations/email.md), [forms.md](../features/forms.md), [governance-costs.md](../operations/governance-costs.md), [client-lifecycle.md](./client-lifecycle.md)*

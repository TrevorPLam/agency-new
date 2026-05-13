# Vertical Demo Sites

**Purpose:** Each demo is a fully functional, production‑quality client site, scaffolded via `pnpm generate app-client --demo --vertical <name>`. Demos prove the architecture end‑to‑end and serve as the exact starting state for paying clients.

---

## 1. Shared Architecture (All Demos)

- **Framework:** Next.js 16.2.6 App Router
- **Caching:** Explicit `'use cache'` with `cacheLife` profiles
- **Packages:** `firm-ui`, `firm-forms` + Turnstile, `firm-analytics` (Umami), `firm-consent`, `firm-seo`, `firm-cms` (Keystatic)
- **Booking:** `adapters-booking-cal` (Cal.com v2)
- **CRM:** `adapters-crm-gohighlevel` (conditional — falls back to local DB if no API key)
- **Security:** CSP via `proxy.ts`, rate limiting via `firm-security`
- **Observability:** `/api/health`, structured logging to Loki

---

## 2. Nail Salon / Nail Tech

**Primary CTA:** Book Appointment

| Route | Purpose |
|-------|---------|
| `/` | Hero + "Book Now" CTA, gallery strip, reviews |
| `/services` | Service menu with pricing, duration |
| `/gallery` | Full nail art portfolio grid |
| `/booking` | Cal.com v2 widget |
| `/reviews` | GBP reviews + testimonials |
| `/contact` | Map, hours, phone |

**Key SEO targets:** `nail salon near me`, `gel nails [city]`, `acrylic nails [city]`

---

## 3. Hair Salon / Hair Stylist

**Primary CTA:** Book Appointment (with optional stylist selection)

| Route | Purpose |
|-------|---------|
| `/` | Hero + CTA, stylist intro, reviews |
| `/services` | Cut, colour, treatment menu |
| `/stylists` | Team profiles (or solo bio) |
| `/gallery` | Before/after transformations |
| `/booking` | Cal.com v2 with stylist selection |
| `/reviews` | GBP reviews |
| `/contact` | Location, hours, parking |

**Key SEO targets:** `hair salon near me`, `balayage [city]`, `colour correction [city]`

---

## 4. Tattoo Studio / Tattoo Artist

**Primary CTA:** Book Consultation (NOT a direct booking)

| Route | Purpose |
|-------|---------|
| `/` | Portfolio hero, "Request Consultation" CTA |
| `/portfolio` | Full gallery, filterable by style/artist |
| `/artists` | Artist profiles with specialties |
| `/styles` | Educational guide to tattoo styles |
| `/consultation` | Design brief, size, placement, reference upload |
| `/faq` | Aftercare, pricing, process |
| `/contact` | Location, hours, deposit policy |

**Key SEO targets:** `tattoo shop near me`, `[style] tattoo [city]`

---

## 5. Day Care Center

**Primary CTA:** Schedule a Tour (parents tour first)

| Route | Purpose |
|-------|---------|
| `/` | Hero with accreditation badges, trust signals |
| `/programs` | Age groups, curriculum, daily schedule |
| `/safety` | Staff credentials, safety policies |
| `/staff` | Director + teacher profiles |
| `/enrollment` | Availability, waitlist indicator, pricing |
| `/tour` | Cal.com tour scheduling widget |
| `/faq` | Common parent questions |
| `/contact` | Address, hours, emergency contact |

**Key SEO targets:** `daycare near me`, `infant care [city]`

---

## 6. Car Detailing

**Primary CTA:** Book a Detail Package

| Route | Purpose |
|-------|---------|
| `/` | Hero with before/after, package highlights |
| `/services` | Package tiers with pricing |
| `/gallery` | Before/after transformations |
| `/booking` | Package selection + Cal.com date/time |
| `/service-area` | Map of covered zip codes (mobile variant) |
| `/faq` | Duration, ceramic coating info |
| `/contact` | Location or service area info |

**Key SEO targets:** `car detailing near me`, `mobile car detailing [city]`, `ceramic coating [city]`

---

## 7. Emergency Roadside / Flat Tire

**Primary CTA:** Call Now (primary) + contact form (secondary)

| Route | Purpose |
|-------|---------|
| `/` | Phone above fold, sticky "Call Now" button, service area |
| `/services` | Flat tire, jump start, lockout, fuel delivery |
| `/service-area` | Coverage map + response time |
| `/pricing` | Transparent flat rates |
| `/contact` | Secondary form for non‑emergency quotes |

**Key SEO targets:** `flat tire service near me`, `roadside assistance [city]`, `emergency tire change [city]`

---

## 8. Demo Build Order

1. Nail Salon – simplest conversion flow
2. Hair Salon – validates multi‑stylist booking
3. Car Detailing – package tiers + mobile variant
4. Emergency Roadside – click‑to‑call + transparent pricing
5. Tattoo Studio – consultation form + portfolio filtering
6. Day Care – trust/safety content + waitlist

---

## 9. Acceptance Criteria (Every Demo)

- Lighthouse Performance ≥ 95, Accessibility = 100
- Consent banner on first visit; no third‑party cookies before consent
- Contact form submits successfully (Turnstile + Inngest dispatch)
- Booking widget loads and allows selection
- All images served via CDN, lazy‑loaded
- Structured data passes Google Rich Results Test
- CSP header present (nonce‑based)
- `/api/health` returns 200
- `pnpm turbo test:a11y` passes with zero critical violations
- Renders correctly at 375px, 768px, 1280px
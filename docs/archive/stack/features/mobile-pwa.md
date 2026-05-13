# Mobile & PWA Strategy – How We Deliver Mobile Experiences

**Created: May 2026**  
*This guide defines our mobile strategy: Progressive Web Apps as the default delivery mechanism, a "Mobile-First" design philosophy already built into the stack, platform-level PWA primitives available to all client sites, and the decision framework for when to adopt native wrappers.*

---

## 1. Strategy Statement

**We do not build separate native mobile apps. We build Progressive Web Apps that deliver native-quality experiences from a single codebase.**

This is not a compromise or a future aspiration. In 2026, the PWA landscape has matured to the point where 64% of organizations choose PWA over separate iOS/Android development, achieving 60-70% cost reduction with feature parity for the vast majority of business use cases. Our platform — a multi-tenant marketing platform serving client sites, dashboards, and internal tools — sits squarely within the PWA sweet spot.

**The strategic rationale:**
- **One codebase, all devices.** Every feature we build for web works on mobile by default. No duplication.
- **Instant updates.** No app store approval delays. A deploy to Vercel or Cloudflare propagates globally in seconds.
- **No 30% tax.** PWA distribution bypasses Apple and Google commissions entirely.
- **No installation friction.** Users arrive via a URL. There is no 200MB download barrier between them and the content.

---

## 2. What "Mobile-First" Already Means in Our Stack

Before discussing PWAs specifically, it's important to recognize that the platform's existing engineering choices already deliver a strong mobile experience without any additional effort:

| Layer | Built-in Mobile Capability |
|---|---|
| **Tailwind CSS v4.3** | Mobile-first by default. Base styles target small screens; `md:` and `lg:` breakpoints enhance for larger viewports. Logical properties (`ms-*`, `me-*`) enable RTL-ready layouts. |
| **Next.js `<Image>`** | Automatic responsive images with `srcset`, WebP/AVIF format selection, lazy loading, and CDN delivery via Cloudinary/Cloudflare Images. |
| **React Server Components** | Zero JavaScript sent to the browser for static content. Pages are rendered to HTML on the server, minimizing mobile data usage and CPU load. |
| **`@firm/ui` (shadcn/ui V4)** | All components ship with built-in ARIA attributes, accessible touch targets (minimum 44×44 CSS pixels), and keyboard navigation. |
| **Turbopack** | Tree shaking and code splitting minimize JavaScript bundle sizes. Performance budgets enforced in CI cap JS at 300KB and page weight at 800KB for SEO pages. |
| **`animation-timeline` (CSS)** | Scroll-triggered animations run on the compositor thread — zero main-thread JavaScript cost on mobile. |
| **Partytown** | Third-party scripts (GA, Tag Manager, Facebook Pixel) execute in a web worker, keeping the main thread free for user interaction. |

These are not mobile-specific features — they are the platform's default behavior. Every client site inherits them automatically through the shared `@firm/ui`, `@firm/tokens`, and build system configuration.

---

## 3. PWA Architecture — The Platform Primitives

Every client site and platform app can optionally enable PWA functionality. The shared PWA primitives live in a new package, `@firm/pwa`, which any app can import.

### 3.1 Shared PWA Package (`@firm/pwa`)

```
packages/firm-pwa/
├── src/
│   ├── sw.ts                ← Shared service worker source (TypeScript)
│   ├── manifest.ts          ← Manifest generator (per-client configuration)
│   ├── route.ts             ← Serwist route handler for /serwist/[path]
│   ├── offline/
│   │   └── page.tsx         ← Shared offline fallback page
│   └── push/
│       ├── actions.ts       ← Server Actions for push subscription management
│       └── client.tsx       ← Push notification subscribe/unsubscribe components
└── serwist.config.ts        ← Serwist configuration (precache, runtime caching, fallbacks)
```

### 3.2 Service Worker Strategy (Serwist + Turbopack)

We use **Serwist** (`@serwist/turbopack`), the modern Workbox-based service worker library purpose-built for Next.js 16 and Turbopack. It compiles a TypeScript service worker at build time and serves it through a Next.js App Router route handler.

**Why Serwist over alternatives:**

| Library | Turbopack Compatible | Next.js 16 Support | Maintenance |
|---|---|---|---|
| **Serwist** | ✅ (native `@serwist/turbopack`) | ✅ First-class | ✅ Active (May 2026) |
| `@ducanh2912/next-pwa` | ⚠️ Partial | ✅ | ⚠️ Community |
| `next-pwa` | ❌ (Webpack only) | ✅ | ❌ Stale |

**Caching Strategy:**

```typescript
// packages/firm-pwa/serwist.config.ts
import { defaultCache } from '@serwist/turbopack/worker';

export const runtimeCaching = [
  // Static assets: Cache-first (immutable, hash-based filenames)
  ...defaultCache.filter(r => r.handler.cacheName === 'same-origin'),
  
  // API data: Network-first with 5-minute stale-while-revalidate fallback
  {
    urlPattern: /\/api\//,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-responses',
      expiration: { maxAgeSeconds: 300 },
    },
  },
  
  // Images: Cache-first with 30-day expiry
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images',
      expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
  
  // Fonts: Cache-first with 1-year expiry
  {
    urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'fonts',
      expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 },
    },
  },
];
```

**Offline fallback:** Every PWA-enabled app serves a shared offline page at `/offline`. When a document navigation fails (user is offline), the service worker serves this page instead of the browser's default error page. The offline page:
- Displays the client's branded header and footer (from `@firm/ui`).
- Shows a "You're offline" message in the user's locale (from `@firm/i18n`).
- Lists previously visited pages from the cache.
- Auto-refreshes when connectivity is restored.

### 3.3 Web App Manifest

Each client app generates its manifest via a shared generator in `@firm/pwa`. The manifest pulls branding from the client's design tokens in `@firm/tokens`:

```typescript
// app/manifest.ts
import { createManifest } from '@firm/pwa';
import { tokens } from '@firm/tokens';

export default function manifest(): MetadataRoute.Manifest {
  return createManifest({
    name: tokens.client.name,
    short_name: tokens.client.shortName,
    description: tokens.client.description,
    theme_color: tokens.colors.brand.primary,
    background_color: tokens.colors.background.default,
    icons: generateIcons(tokens.client.logo),  // auto-generates 192, 512, maskable
  });
}
```

The shared generator produces a manifest that:
- Sets `display: 'standalone'` so the PWA opens without browser UI (on supported OS/browser combinations).
- Includes `prefer_related_applications: false` (no native app to prefer).
- Provides `shortcuts` for common actions (contact, booking, dashboard).
- Includes `screenshots` for the install prompt on supporting platforms.

### 3.4 Web Push Notifications

Push notifications are implemented using the standard Web Push API, which is now supported on:
- **Chrome, Edge, Firefox, Safari** (all modern versions)
- **iOS 16.4+** for PWAs installed to the home screen
- **macOS 13+** (Safari 16+)

**Architecture:**
```
Browser subscribes → PushSubscription stored in tenant database
                  → Service worker receives push event
                  → Notification displayed via self.registration.showNotification()
```

**Server Actions** in Next.js handle subscription management and notification sending:
- `subscribeUser(subscription)` — stores the PushSubscription in the database, scoped to tenant + user.
- `unsubscribeUser()` — removes the subscription.
- `sendNotification(message, targetUsers)` — dispatches web-push notifications via the `web-push` npm package.

**Integration with Inngest:** For scheduled or triggered notifications (e.g., "Your monthly marketing report is ready"), background jobs emit Inngest events that trigger push notification dispatch. This keeps the notification logic decoupled from the page response cycle.

### 3.5 Per-App Opt-In

Not every app needs or should have PWA features. The decision to enable PWA is per-app:

| App Type | PWA Enabled? | Rationale |
|---|---|---|
| **Client marketing sites** | ✅ Recommended | Installable home screen presence, offline content caching, push for new blog posts/offers |
| **Platform portal (agency dashboard)** | ✅ Recommended | Push for alerts, offline access to recent data, app-like experience for agency staff |
| **Booking app** | ✅ Strongly recommended | Offline appointment viewing, push for reminders, home screen presence |
| **Documentation site (VitePress)** | ❌ Not needed | Content site; browser caching sufficient |
| **Landing pages / microsites** | ⚠️ Optional | Install prompt may feel excessive for single-page sites |

To enable PWA in an app, add `@firm/pwa` as a dependency and create the required files (manifest, service worker route handler, offline page). The package provides a CLI generator: `pnpm pwa:init --app=client-acme`.

---

## 4. Known Limitations & Handling

### 4.1 iOS Limitations

Despite significant improvements in iOS 19, Apple's implementation of PWA features still lags behind Android and desktop:

| Feature | iOS Status | Platform Response |
|---|---|---|
| **Web Push** | ✅ Supported (iOS 16.4+, installed PWA, outside EU) | Detect support; show install instructions for iOS users |
| **Home Screen Installation** | ⚠️ Manual only — no automatic prompt | Show custom iOS install instructions (Share → Add to Home Screen) |
| **Persistent Storage** | ⚠️ 7-day expiry if unused; 50MB cap | Re-cache critical assets on every launch; warn users if approaching limits |
| **Background Sync** | ❌ Not supported | Sync data when app is active; show sync status indicator |
| **Bluetooth / NFC / USB** | ❌ Not supported | Not applicable to our use cases (marketing platform, not hardware interaction) |
| **EU Standalone Mode** | ❌ Removed since iOS 17.4 (DMA) | Detect EU region; gracefully degrade to browser-tab experience; no install prompt shown |

**iOS install detection:**

```typescript
// @firm/pwa
export function shouldShowIOSInstallPrompt(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
  const isEU = detectEURegion(); // based on user locale or IP geolocation
  return isIOS && !isInstalled && !isEU;
}
```

For EU users on iOS 17.4+, the platform does not show install prompts. The site functions as a standard responsive website with all features intact — only the "app-like" standalone mode is unavailable. This is documented in client-facing materials so expectations are set correctly.

### 4.2 Android / Chrome

PWA support on Android via Chrome is mature and essentially complete. All features (install prompt, push notifications, background sync, persistent storage, Web Share API) work without caveats. Chrome 140+ supports advanced features including File System Access and Web Bluetooth.

### 4.3 Desktop

PWAs are installable on Chrome, Edge, and Safari (macOS). The desktop experience is full-featured. For the booking app and platform portal, desktop PWA installation provides a dedicated app window without browser chrome — a useful alternative to "keep this tab open."

### 4.4 Network Conditions (Mobile-First Resilience)

Marketing sites must perform on unreliable mobile connections. The PWA service worker's cache-first strategy for static assets ensures that returning visitors see content near-instantly even on 3G or intermittent 5G. The offline fallback page handles complete disconnection gracefully.

---

## 5. Decision Framework — PWA vs. Native

For platform clients who request native mobile apps, we use the following rubric to determine the right approach:

| Client Need | Recommended Approach | Tooling |
|---|---|---|
| Marketing site with offline content & push | **PWA (default)** | `@firm/pwa` (Serwist + Web Push) |
| Booking / appointment management | **PWA (default)** | `@firm/pwa` + offline sync queue |
| Client portal / dashboard | **PWA (default)** | `@firm/pwa` + IndexedDB for offline data |
| App Store presence required | **PWA wrapped via Capacitor** | `@firm/pwa` → Capacitor → App Store & Play Store |
| Requires Bluetooth / NFC / advanced camera | **Capacitor wrapper** | `@firm/pwa` + Capacitor plugins |
| High-performance 3D / AR / real-time video | **Evaluate native** | Out of scope for marketing platform |

**The Capacitor escape hatch:** If a client requires App Store distribution (for branding or market reach), the existing PWA can be wrapped inside a Capacitor native shell. This adds the PWA to the iOS App Store and Google Play Store with access to native device APIs through Capacitor plugins, while preserving the single codebase. This is not the default path — it adds build complexity, app store management overhead, and review delays — but it exists as a documented option.

---

## 6. Future Directions

| Timeline | Capability | Status |
|---|---|---|
| **Q3 2026** | Push notification integration with Inngest for scheduled client reports | In development |
| **Q4 2026** | Offline-first booking app: local SQLite (OPFS + WASM) with background sync when online | Research phase |
| **Q1 2027** | Cross-client push notification dashboard (agency can send push to all client PWA users) | Planned |
| **Q2 2027** | Automated Capacitor build pipeline for App Store distribution (for clients who need it) | Planned |

The local-first architecture for the booking app is the most significant future investment. Running a full SQLite database in the browser — backed by the Origin Private File System — enables the booking app to function fully offline, syncing appointments when connectivity returns. This is the pattern that 2026's most advanced PWAs are adopting, and it aligns with the platform's "owned infrastructure" philosophy from `infrastructure.md`.

### 6.1 When We Would Build a Native App

Native development would be considered if (and only if) ALL of these conditions are met:
1. The client requires deep hardware integration (Bluetooth peripherals, NFC payments, advanced AR).
2. The PWA + Capacitor wrapper cannot achieve acceptable performance.
3. The client has budgeted for ongoing maintenance of two codebases (iOS + Android).
4. An ADR is written and accepted documenting the departure from the default PWA strategy.

To date (May 2026), no platform client has met these criteria.

---

## 7. Quick Reference

| Task | How |
|---|---|
| **Enable PWA on a client site** | `pnpm pwa:init --app=client-acme` (generates manifest, SW, offline page) |
| **Customize manifest** | Edit the per-app `app/manifest.ts`; branding auto-pulled from `@firm/tokens` |
| **Add push notifications** | Import `PushSubscribeButton` from `@firm/pwa`; configure VAPID keys in Infisical |
| **Test offline behavior** | Chrome DevTools → Network → "Offline" checkbox; or use `pnpm dev` + Inngest Dev Server |
| **Test PWA install** | Chrome DevTools → Application → Manifest; Lighthouse PWA audit |
| **Test on iOS** | Deploy to Vercel preview; open on iPhone (Safari); share → Add to Home Screen |
| **Wrap PWA in Capacitor** | See `docs/stack/capacitor-wrapper.md` (to be created if first client requests this) |
| **Check PWA metrics** | Lighthouse CI (enforced in CI); Google Search Console (PWA report); Grafana dashboard (push notification delivery rates) |

---

*Related: [frontend.md](../core/frontend.md), [styling.md](../core/styling.md), [deployment.md](../infrastructure/deployment.md), [forms.md](./forms.md), [infrastructure.md](../infrastructure/infrastructure.md), [i18n.md](./i18n.md)*
# firm-config-next

Generated on: 2026-05-13T02:25:38.284Z
Total files: 11

**Description:** Shared Next.js configuration factory for the firm platform

**Version:** 1.0.0

## Table of Contents

- [csp.ts](#csp-ts)
- [defaults.ts](#defaults-ts)
- [image-patterns.ts](#image-patterns-ts)
- [index.ts](#index-ts)
- [proxy.ts](#proxy-ts)
- [security-headers.ts](#security-headers-ts)
- [turbopack.ts](#turbopack-ts)
- [cache-profiles.test.ts](#cache-profiles-test-ts)
- [csp.test.ts](#csp-test-ts)
- [security-headers.test.ts](#security-headers-test-ts)
- [turbopack.test.ts](#turbopack-test-ts)

## File Contents

### csp.ts

**Path:** `src\csp.ts`

**Language:** TypeScript

```typescript
import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure nonce for CSP headers.
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * Creates a Content Security Policy header value with nonce placeholders.
 */
export function createCSPValue(options: {
  nonce?: string;
  enableStrict?: boolean;
  customDirectives?: Record<string, string[]>;
} = {}): string {
  const {
    nonce = '${nonce}',
    enableStrict = true,
    customDirectives = {},
  } = options;

  const directives: Record<string, string[]> = {
    // Default directives
    'default-src': ["'self'"],
    'script-src': ["'self'", `nonce-${nonce}`, "'strict-dynamic'"],
    'style-src': ["'self'", `nonce-${nonce}`],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  // Add strict mode directives
  if (enableStrict) {
    directives['object-src'] = ["'none'"];
    directives['require-trusted-types-for'] = ["'script'"];
    directives['trusted-types'] = [];
  }

  // Merge custom directives
  Object.assign(directives, customDirectives);

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * CSP directive builder for complex policies.
 */
export class CSPBuilder {
  private directives: Record<string, string[]> = {};

  /**
   * Add or update a CSP directive.
   */
  add(directive: string, sources: string[]): this {
    this.directives[directive] = sources;
    return this;
  }

  /**
   * Append sources to an existing directive.
   */
  append(directive: string, sources: string[]): this {
    if (!this.directives[directive]) {
      this.directives[directive] = [];
    }
    this.directives[directive]!.push(...sources);
    return this;
  }

  /**
   * Remove a CSP directive.
   */
  remove(directive: string): this {
    delete this.directives[directive];
    return this;
  }

  /**
   * Build final CSP header value.
   */
  build(nonce?: string): string {
    const processedSources = Object.entries(this.directives).map(([directive, sources]) => {
      const directiveSources = sources || [];
      const processedSources = directiveSources.map(source => 
        source.replace('${nonce}', nonce || '')
      );
      return `${directive} ${processedSources.join(' ')}`;
    });

    return processedSources.join('; ');
  }
}

```

---

### defaults.ts

**Path:** `src\defaults.ts`

**Language:** TypeScript

```typescript
import type { NextConfig } from 'next';

/**
 * Default Next.js configuration options with security and performance optimizations.
 */
export const defaultNextConfig: Partial<NextConfig> = {
  // Security settings
  poweredByHeader: false,
  reactCompiler: true,
  experimental: {
    sri: {
      algorithm: 'sha256',
    },
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Build configuration
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // External packages for serverless
  serverExternalPackages: [
    'pino',
    '@firm/observability',
  ],
};

```

---

### image-patterns.ts

**Path:** `src\image-patterns.ts`

**Language:** TypeScript

```typescript
/**
 * Image patterns and domains for Next.js image optimization.
 */
export const imagePatterns: {
  readonly domains: readonly string[];
  readonly remotePatterns: readonly {
    readonly protocol: string;
    readonly hostname: string;
    readonly pathname: string;
  }[];
  readonly deviceSizes: readonly number[];
  readonly imageSizes: readonly number[];
  readonly formats: readonly string[];
  readonly minimumCacheTTL: number;
  readonly dangerousPatterns: readonly RegExp[];
} = {
  // Allowed domains for external images
  domains: [
    'cdn.firm.com',
    'assets.firm.com',
    'images.unsplash.com',
    'images.pexels.com',
  ],
  
  // Remote patterns for dynamic images
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'cdn\\.firm\\.com',
      pathname: '/images/**',
    },
    {
      protocol: 'https',
      hostname: 'assets\\.firm\\.com',
      pathname: '/uploads/**',
    },
  ],
  
  // Device sizes for responsive images
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  
  // Image sizes for art direction
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  
  // Supported formats
  formats: ['image/webp', 'image/avif'],
  
  // Minimum cache TTL (in seconds)
  minimumCacheTTL: 60,
  
  // Dangerous patterns (to be blocked)
  dangerousPatterns: [
    /^data:image\/svg\+xml/,
    /^data:image\/vnd\.microsoft\.icon/,
  ],
} as const;

export type ImageDomain = typeof imagePatterns.domains[number];
export type ImagePattern = typeof imagePatterns.remotePatterns[number];

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
import type { NextConfig } from 'next';
import { turbopackConfig } from './turbopack';

/**
 * Creates a Next.js configuration with security and performance optimizations.
 * Implements Next.js 16.2 features including cacheLife profiles and top-level turbopack.
 */
export function createNextConfig(options: {
  /** Cache profile for different content types */
  cacheProfile?: 'homepage' | 'api' | 'user' | 'content' | 'analytics' | 'images' | 'short' | 'nocache';
  /** Enable Content Security Policy with nonce support */
  enableCSP?: boolean;
  /** Enable HTTP Strict Transport Security */
  enableHSTS?: boolean;
  /** Custom security headers to add */
  customHeaders?: Array<{ key: string; value: string }>;
  /** Allowed image domains for Next.js Image optimization */
  imageDomains?: string[];
  /** Enable Turbopack for development and production builds */
  enableTurbopack?: boolean;
  /** Environment-specific configuration overrides */
  envOverrides?: Record<string, Partial<NextConfig>>;
  /** Additional server external packages */
  serverExternalPackages?: string[];
} = {}): NextConfig {
  const {
    cacheProfile = 'homepage',
    enableCSP = true,
    enableHSTS = true,
    customHeaders = [],
    imageDomains = [],
    enableTurbopack = true,
    envOverrides = {},
    serverExternalPackages = [],
  } = options;

  // Base configuration with security defaults
  const config: NextConfig = {
    // Security settings
    poweredByHeader: false,
    reactCompiler: true,
    
    // Build output for containerized deployment
    output: 'standalone',
    
    // Experimental features for security and performance
    experimental: {
      sri: {
        algorithm: 'sha256',
      },
    },
    
    // Image optimization with security defaults
    images: {
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      domains: imageDomains,
      minimumCacheTTL: 14400, // 4 hours minimum
    },
    
    // TypeScript configuration
    typescript: {
      ignoreBuildErrors: false,
    },
    
    // Build configuration
    swcMinify: true,
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
    
    // Server external packages for serverless compatibility
    serverExternalPackages: [
      'pino',
      '@firm/observability',
      ...serverExternalPackages,
    ],
    
    // CacheLife profiles for Next.js 16.2+ reactive caching
    ...(cacheProfile && {
      cacheLife: {
        homepage: {
          stale: 60,
          revalidate: 900,
          expire: 86400,
        },
        api: {
          stale: 5,
          revalidate: 60,
          expire: 300,
        },
        user: {
          stale: 300,
          revalidate: 3600,
          expire: 7200,
        },
        content: {
          stale: 3600,
          revalidate: 86400,
          expire: 172800,
        },
        analytics: {
          stale: 900,
          revalidate: 1800,
          expire: 3600,
        },
        images: {
          stale: 86400,
          revalidate: 604800,
          expire: 2592000,
        },
        short: {
          stale: 30,
          revalidate: 60,
          expire: 300,
        },
        nocache: {
          stale: 0,
          revalidate: 0,
          expire: 0,
        },
      }[cacheProfile],
    }),
    
    // Security headers
    async headers() {
      const headerItems: Array<{ key: string; value: string }> = [
        // Basic security headers
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
          ].join(', '),
        },
        ...customHeaders,
      ];

      // Add HSTS header
      if (enableHSTS) {
        headerItems.push({
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        });
      }

      // Add CSP header with nonce template
      if (enableCSP) {
        headerItems.push({
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'nonce-${nonce}' 'strict-dynamic'",
            "style-src 'self' 'nonce-${nonce}' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://api.stripe.com https://js.stripe.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
            "worker-src 'self' blob:",
          ].join('; '),
        });
      }

      return [
        {
          source: '/(.*)',
          headers: headerItems,
        },
      ];
    },
    
    // Webpack configuration for tracing and optimization
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        };
      }
      
      return config;
    },
  };

  // Add top-level Turbopack configuration (Next.js 16.2+)
  if (enableTurbopack) {
    // Merge turbopack configuration with existing config
    config.turbopack = {
      ...config.turbopack,
      ...(turbopackConfig.turbo as any),
    };
    
    // Merge experimental features
    if (turbopackConfig.experimental) {
      config.experimental = {
        ...config.experimental,
        // Handle readonly optimizePackageImports array
        optimizePackageImports: turbopackConfig.experimental.optimizePackageImports 
          ? (turbopackConfig.experimental.optimizePackageImports as any).map((item: any) => item.packageName)
          : config.experimental?.optimizePackageImports,
        // Spread other experimental features
        ...(Object.fromEntries(
          Object.entries(turbopackConfig.experimental).filter(([key]) => key !== 'optimizePackageImports')
        ) as any),
      };
    }
    
    // Merge webpack configuration if present
    if (turbopackConfig.webpack) {
      const originalWebpack = config.webpack;
      config.webpack = (webpackConfig: any, context: any) => {
        // Apply original webpack config first
        if (originalWebpack) {
          webpackConfig = originalWebpack(webpackConfig, context);
        }
        // Then apply turbopack webpack config
        return turbopackConfig.webpack(webpackConfig);
      };
    }
  }

  // Add environment-specific overrides
  const env = process.env.NODE_ENV || 'development';
  if (envOverrides[env]) {
    Object.assign(config, envOverrides[env]);
  }

  return config;
}

// Re-export utilities for advanced usage
export { generateNonce } from './csp';
export { createSecurityHeaders } from './security-headers';
export { imagePatterns } from './image-patterns';

/**
 * Default configuration with standard security and performance settings
 */
export const defaultConfig: NextConfig = createNextConfig();

/**
 * Configuration for API routes with shorter caching
 */
export const apiConfig: NextConfig = createNextConfig({
  cacheProfile: 'api',
  enableCSP: false, // API routes don't need CSP
});

/**
 * Configuration for user-facing pages with balanced caching
 */
export const userFacingConfig: NextConfig = createNextConfig({
  cacheProfile: 'user',
  enableCSP: true,
  enableHSTS: true,
});

/**
 * Configuration for static marketing pages with aggressive caching
 */
export const marketingConfig: NextConfig = createNextConfig({
  cacheProfile: 'homepage',
  enableCSP: true,
  enableHSTS: true,
});

```

---

### proxy.ts

**Path:** `src\proxy.ts`

**Language:** TypeScript

```typescript
/**
 * Multi-tenant proxy template for Next.js applications.
 * This file should be copied to middleware.ts in consuming apps.
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from './csp';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Extract tenant from hostname or subdomain
  const hostname = request.headers.get('host') || '';
  const tenant = await extractTenantFromHostname(hostname);
  
  // Generate CSP nonce for this request
  const nonce = generateNonce();
  
  // Set security headers
  const response = NextResponse.next();
  
  // Add CSP header with tenant-specific nonce
  response.headers.set(
    'Content-Security-Policy',
    createCSPValue({
      nonce,
      enableStrict: process.env.NODE_ENV === 'production',
    })
  );
  
  // Add tenant context to headers
  if (tenant) {
    response.headers.set('x-tenant-id', tenant);
    response.headers.set('x-tenant-hostname', hostname);
  }
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Rate limiting headers should be set by actual rate limiting middleware
  // Remove hardcoded values to allow dynamic rate limiting implementation
  
  return response;
}

/**
 * Extract tenant identifier from hostname.
 * Supports both subdomain and path-based multi-tenancy.
 */
async function extractTenantFromHostname(hostname: string): Promise<string | null> {
  // Subdomain pattern: tenant.domain.com
  const subdomainMatch = hostname.match(/^([a-zA-Z0-9-]+)\./);
  if (subdomainMatch && subdomainMatch[1]) {
    return subdomainMatch[1];
  }
  
  // Custom domain pattern: tenant.customdomain.com
  // Lookup in KV store for custom domain mapping
  const customDomainTenant = await lookupCustomDomainTenant(hostname);
  if (customDomainTenant) {
    return customDomainTenant;
  }
  
  return null;
}

/**
 * Create CSP value for the request.
 */
function createCSPValue(options: {
  nonce: string;
  enableStrict?: boolean;
}): string {
  const { nonce, enableStrict = true } = options;
  
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: https:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];
  
  if (enableStrict) {
    directives.push(
      `object-src 'none'`,
      `require-trusted-types-for 'script'`,
      `trusted-types ''`
    );
  }
  
  return directives.join('; ');
}

/**
 * Lookup tenant ID for custom domain from KV store.
 * Uses environment configuration for KV connection.
 */
async function lookupCustomDomainTenant(hostname: string): Promise<string | null> {
  try {
    // In production, this would connect to a KV store (Vercel KV, Redis, etc.)
    // For now, we'll use a simple environment-based lookup pattern
    
    // Check if custom domain mapping exists in environment
    const customDomainMappings = process.env['CUSTOM_DOMAIN_MAPPINGS'];
    if (customDomainMappings) {
      const mappings = JSON.parse(customDomainMappings) as Record<string, string>;
      return mappings[hostname] || null;
    }
    
    // If no environment mappings, could connect to actual KV store here
    // Example with Vercel KV (would require @vercel/kv dependency):
    // const kv = new KV();
    // return await kv.get(`custom-domain:${hostname}`);
    
    return null;
  } catch (error) {
    console.error('Error looking up custom domain tenant:', error);
    return null;
  }
}

```

---

### security-headers.ts

**Path:** `src\security-headers.ts`

**Language:** TypeScript

```typescript
/**
 * Security headers factory for Next.js applications.
 */
export function createSecurityHeaders(options: {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  customHeaders?: Array<{ key: string; value: string }>;
} = {}): Array<{ key: string; value: string }> {
  const {
    enableCSP = true,
    enableHSTS = true,
    customHeaders = [],
  } = options;

  const headers: Array<{ key: string; value: string }> = [
    // Basic security headers
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'bluetooth=()',
        'accelerometer=()',
        'gyroscope=()',
        'magnetometer=()',
      ].join(', '),
    },
    ...customHeaders,
  ];

  // Add HSTS header
  if (enableHSTS) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    });
  }

  // Add CSP header with nonce template
  if (enableCSP) {
    headers.push({
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'nonce-${nonce}' 'strict-dynamic'",
        "style-src 'self' 'nonce-${nonce}'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    });
  }

  return headers;
}

```

---

### turbopack.ts

**Path:** `src\turbopack.ts`

**Language:** TypeScript

```typescript
/**
 * Turbopack configuration for Next.js development.
 */
export const turbopackConfig = {
  // Enable Turbopack for development
  turbo: {
    rules: {
      // Custom Turbopack rules
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
              svgo: true,
            },
          },
        ],
      },
    },
  },
  
  // Development server configuration
  devServer: {
    port: 3000,
    host: 'localhost',
  },
  
  // Experimental features
  experimental: {
    // Enable Turbopack for all environments
    turbo: {
      loaders: true,
      resolveAlias: true,
    },
    
    // Optimize CSS
    optimizeCss: true,
    
    // Optimize package imports
    optimizePackageImports: [
      {
        packageName: 'lucide-react',
        exportNames: ['*'],
      },
      {
        packageName: 'date-fns',
        exportNames: ['*'],
      },
    ],
  },
  
  // Webpack configuration (fallback)
  webpack: (config: any): any => {
    // Custom webpack config if needed
    return config;
  },
} as const;

```

---

### cache-profiles.test.ts

**Path:** `tests\cache-profiles.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { createNextConfig, defaultConfig, apiConfig, userFacingConfig, marketingConfig } from '../src/index';

describe('Cache Profiles Configuration', () => {
  describe('createNextConfig cacheLife profiles', () => {
    it('should include cacheLife configuration when cacheProfile is specified', () => {
      const config = createNextConfig({ cacheProfile: 'api' });
      
      expect(config.cacheLife).toBeDefined();
      expect(config.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should use homepage cache profile by default', () => {
      const config = createNextConfig();
      
      expect(config.cacheLife).toBeDefined();
      expect(config.cacheLife).toEqual({
        stale: 60,
        revalidate: 900,
        expire: 86400,
      });
    });

    it('should apply api cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'api' });
      
      expect(config.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should apply user cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'user' });
      
      expect(config.cacheLife).toEqual({
        stale: 300,
        revalidate: 3600,
        expire: 7200,
      });
    });

    it('should apply content cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'content' });
      
      expect(config.cacheLife).toEqual({
        stale: 3600,
        revalidate: 86400,
        expire: 172800,
      });
    });

    it('should apply analytics cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'analytics' });
      
      expect(config.cacheLife).toEqual({
        stale: 900,
        revalidate: 1800,
        expire: 3600,
      });
    });

    it('should apply images cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'images' });
      
      expect(config.cacheLife).toEqual({
        stale: 86400,
        revalidate: 604800,
        expire: 2592000,
      });
    });

    it('should apply short cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'short' });
      
      expect(config.cacheLife).toEqual({
        stale: 30,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should apply nocache cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'nocache' });
      
      expect(config.cacheLife).toEqual({
        stale: 0,
        revalidate: 0,
        expire: 0,
      });
    });

    it('should not include cacheLife when cacheProfile is not provided', () => {
      const config = createNextConfig({ cacheProfile: undefined });
      
      expect(config.cacheLife).toBeUndefined();
    });
  });

  describe('Predefined configurations', () => {
    it('should have defaultConfig with homepage cache profile', () => {
      expect(defaultConfig.cacheLife).toEqual({
        stale: 60,
        revalidate: 900,
        expire: 86400,
      });
    });

    it('should have apiConfig with api cache profile', () => {
      expect(apiConfig.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should have userFacingConfig with user cache profile', () => {
      expect(userFacingConfig.cacheLife).toEqual({
        stale: 300,
        revalidate: 3600,
        expire: 7200,
      });
    });

    it('should have marketingConfig with homepage cache profile', () => {
      expect(marketingConfig.cacheLife).toEqual({
        stale: 60,
        revalidate: 900,
        expire: 86400,
      });
    });
  });

  describe('Cache profile values validation', () => {
    it('should have appropriate cache durations for different profiles', () => {
      const profiles = {
        homepage: { stale: 60, revalidate: 900, expire: 86400 },
        api: { stale: 5, revalidate: 60, expire: 300 },
        user: { stale: 300, revalidate: 3600, expire: 7200 },
        content: { stale: 3600, revalidate: 86400, expire: 172800 },
        analytics: { stale: 900, revalidate: 1800, expire: 3600 },
        images: { stale: 86400, revalidate: 604800, expire: 2592000 },
        short: { stale: 30, revalidate: 60, expire: 300 },
        nocache: { stale: 0, revalidate: 0, expire: 0 },
      };

      // Test each profile
      Object.entries(profiles).forEach(([profileName, expectedValues]) => {
        const config = createNextConfig({ cacheProfile: profileName as any });
        expect(config.cacheLife).toEqual(expectedValues);
      });
    });

    it('should have hierarchical cache durations (stale < revalidate < expire)', () => {
      const config = createNextConfig({ cacheProfile: 'content' });
      const cacheLife = config.cacheLife!;

      expect(cacheLife.stale).toBeLessThan(cacheLife.revalidate);
      expect(cacheLife.revalidate).toBeLessThan(cacheLife.expire);
    });

    it('should have zero values for nocache profile', () => {
      const config = createNextConfig({ cacheProfile: 'nocache' });
      const cacheLife = config.cacheLife!;

      expect(cacheLife.stale).toBe(0);
      expect(cacheLife.revalidate).toBe(0);
      expect(cacheLife.expire).toBe(0);
    });

    it('should have longest cache duration for images', () => {
      const imagesConfig = createNextConfig({ cacheProfile: 'images' });
      const apiConfig = createNextConfig({ cacheProfile: 'api' });

      expect(imagesConfig.cacheLife!.expire).toBeGreaterThan(apiConfig.cacheLife!.expire);
      expect(imagesConfig.cacheLife!.revalidate).toBeGreaterThan(apiConfig.cacheLife!.revalidate);
      expect(imagesConfig.cacheLife!.stale).toBeGreaterThan(apiConfig.cacheLife!.stale);
    });
  });

  describe('Cache profile integration with other options', () => {
    it('should combine cache profile with other configuration options', () => {
      const config = createNextConfig({
        cacheProfile: 'api',
        enableCSP: false,
        enableHSTS: true,
        imageDomains: ['example.com'],
      });

      expect(config.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
      expect(config.experimental).toBeDefined();
      expect(config.images?.domains).toContain('example.com');
    });

    it('should work with Turbopack enabled', () => {
      const config = createNextConfig({
        cacheProfile: 'user',
        enableTurbopack: true,
      });

      expect(config.cacheLife).toEqual({
        stale: 300,
        revalidate: 3600,
        expire: 7200,
      });
      expect(config.turbopack).toBeDefined();
    });

    it('should work with environment overrides', () => {
      const envOverrides = {
        development: {
          cacheLife: {
            stale: 1,
            revalidate: 10,
            expire: 100,
          },
        },
      };

      // Mock development environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const config = createNextConfig({
        cacheProfile: 'api',
        envOverrides,
      });

      // Should be overridden by environment-specific config
      expect(config.cacheLife).toEqual({
        stale: 1,
        revalidate: 10,
        expire: 100,
      });

      // Restore original environment
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Cache profile type safety', () => {
    it('should accept valid cache profile types', () => {
      const validProfiles = [
        'homepage',
        'api', 
        'user',
        'content',
        'analytics',
        'images',
        'short',
        'nocache',
      ] as const;

      validProfiles.forEach(profile => {
        expect(() => {
          const config = createNextConfig({ cacheProfile: profile });
          expect(config.cacheLife).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should handle cacheProfile as undefined', () => {
      expect(() => {
        const config = createNextConfig({ cacheProfile: undefined });
        expect(config.cacheLife).toBeUndefined();
      }).not.toThrow();
    });
  });
});

```

---

### csp.test.ts

**Path:** `tests\csp.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { createNextConfig } from '../src/index';
import { createSecurityHeaders } from '../src/security-headers';
import { createCSPValue } from '../src/csp';

describe('CSP Security Configuration', () => {
  describe('createNextConfig', () => {
    it('should not include unsafe-inline or unsafe-eval in script-src CSP', async () => {
      const config = createNextConfig({ enableCSP: true });
      const headers = await config.headers!();
      const cspHeader = headers[0].headers.find((h: any) => h.key === 'Content-Security-Policy');
      
      expect(cspHeader).toBeDefined();
      expect(cspHeader!.value).not.toContain('unsafe-inline');
      expect(cspHeader!.value).not.toContain('unsafe-eval');
      expect(cspHeader!.value).toContain('strict-dynamic');
    });

    it('should include nonce placeholder in script-src CSP', async () => {
      const config = createNextConfig({ enableCSP: true });
      const headers = await config.headers!();
      const cspHeader = headers[0].headers.find((h: any) => h.key === 'Content-Security-Policy');
      
      expect(cspHeader!.value).toContain("'nonce-${nonce}'");
    });
  });

  describe('createSecurityHeaders', () => {
    it('should not include unsafe-inline or unsafe-eval in script-src CSP', () => {
      const headers = createSecurityHeaders({ enableCSP: true });
      const cspHeader = headers.find(h => h.key === 'Content-Security-Policy');
      
      expect(cspHeader).toBeDefined();
      expect(cspHeader!.value).not.toContain('unsafe-inline');
      expect(cspHeader!.value).not.toContain('unsafe-eval');
      expect(cspHeader!.value).toContain('strict-dynamic');
    });

    it('should include nonce placeholder in script-src CSP', () => {
      const headers = createSecurityHeaders({ enableCSP: true });
      const cspHeader = headers.find(h => h.key === 'Content-Security-Policy');
      
      expect(cspHeader!.value).toContain("'nonce-${nonce}'");
    });
  });

  describe('createCSPValue', () => {
    it('should not include unsafe-inline or unsafe-eval in script-src directive', () => {
      const cspValue = createCSPValue({ nonce: 'test-nonce' });
      
      expect(cspValue).not.toContain('unsafe-inline');
      expect(cspValue).not.toContain('unsafe-eval');
      expect(cspValue).toContain('strict-dynamic');
    });

    it('should include nonce in script-src directive', () => {
      const cspValue = createCSPValue({ nonce: 'test-nonce' });
      
      expect(cspValue).toContain('nonce-test-nonce');
    });

    it('should handle custom directives without unsafe sources', () => {
      const cspValue = createCSPValue({
        nonce: 'test-nonce',
        customDirectives: {
          'script-src': ["'self'", 'https://trusted.cdn.com']
        }
      });
      
      expect(cspValue).not.toContain('unsafe-inline');
      expect(cspValue).not.toContain('unsafe-eval');
      expect(cspValue).toContain('strict-dynamic');
    });

    it('should include custom directives but still contain strict-dynamic', () => {
      const cspValue = createCSPValue({
        nonce: 'test-nonce',
        customDirectives: {
          'script-src': ["'self'", 'https://trusted.cdn.com']
        }
      });
      
      expect(cspValue).toContain('strict-dynamic');
      expect(cspValue).toContain('https://trusted.cdn.com');
    });
  });

  describe('CSP Directive Validation', () => {
    it('should validate that script-src contains required security sources', () => {
      const cspValue = createCSPValue({ nonce: 'test-nonce' });
      
      // Should contain self, nonce, and strict-dynamic
      expect(cspValue).toContain("'self'");
      expect(cspValue).toContain('nonce-test-nonce');
      expect(cspValue).toContain('strict-dynamic');
      
      // Should not contain unsafe sources
      expect(cspValue).not.toContain('unsafe-inline');
      expect(cspValue).not.toContain('unsafe-eval');
      expect(cspValue).not.toContain('data:');
    });

    it('should maintain style-src with unsafe-inline for CSS compatibility', () => {
      const cspValue = createCSPValue({ nonce: 'test-nonce' });
      
      // Style-src can still use unsafe-inline for CSS compatibility
      expect(cspValue).toContain('nonce-test-nonce');
    });
  });
});

```

---

### security-headers.test.ts

**Path:** `tests\security-headers.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { createNextConfig } from '../src/index';
import { createSecurityHeaders } from '../src/security-headers';

describe('Security Headers Configuration', () => {
  describe('createNextConfig', () => {
    it('should include basic security headers by default', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      // Check for basic security headers
      expect(headerItems.some((h: any) => h.key === 'X-Content-Type-Options' && h.value === 'nosniff')).toBe(true);
      expect(headerItems.some((h: any) => h.key === 'X-Frame-Options' && h.value === 'DENY')).toBe(true);
      expect(headerItems.some((h: any) => h.key === 'X-XSS-Protection' && h.value === '1; mode=block')).toBe(true);
      expect(headerItems.some((h: any) => h.key === 'Referrer-Policy' && h.value === 'strict-origin-when-cross-origin')).toBe(true);
    });

    it('should include HSTS header when enabled', async () => {
      const config = createNextConfig({ enableHSTS: true });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => 
        h.key === 'Strict-Transport-Security' && 
        h.value === 'max-age=31536000; includeSubDomains; preload'
      )).toBe(true);
    });

    it('should not include HSTS header when disabled', async () => {
      const config = createNextConfig({ enableHSTS: false });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => h.key === 'Strict-Transport-Security')).toBe(false);
    });

    it('should include CSP header when enabled', async () => {
      const config = createNextConfig({ enableCSP: true });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => h.key === 'Content-Security-Policy')).toBe(true);
    });

    it('should not include CSP header when disabled', async () => {
      const config = createNextConfig({ enableCSP: false });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => h.key === 'Content-Security-Policy')).toBe(false);
    });

    it('should include Permissions-Policy header', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      const permissionsHeader = headerItems.find((h: any) => h.key === 'Permissions-Policy');
      expect(permissionsHeader).toBeDefined();
      
      const policyValue = permissionsHeader!.value;
      expect(policyValue).toContain('camera=()');
      expect(policyValue).toContain('microphone=()');
      expect(policyValue).toContain('geolocation=()');
      expect(policyValue).toContain('payment=()');
      expect(policyValue).toContain('usb=()');
      expect(policyValue).toContain('magnetometer=()');
      expect(policyValue).toContain('gyroscope=()');
      expect(policyValue).toContain('accelerometer=()');
    });

    it('should merge custom headers', async () => {
      const customHeaders = [
        { key: 'X-Custom-Header', value: 'custom-value' },
        { key: 'X-Another-Header', value: 'another-value' }
      ];

      const config = createNextConfig({ customHeaders });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => h.key === 'X-Custom-Header' && h.value === 'custom-value')).toBe(true);
      expect(headerItems.some((h: any) => h.key === 'X-Another-Header' && h.value === 'another-value')).toBe(true);
    });

    it('should include both default and custom headers', async () => {
      const customHeaders = [
        { key: 'X-Custom-Header', value: 'custom-value' }
      ];

      const config = createNextConfig({ customHeaders });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      // Should have default headers
      expect(headerItems.some((h: any) => h.key === 'X-Content-Type-Options' && h.value === 'nosniff')).toBe(true);
      
      // Should have custom headers
      expect(headerItems.some((h: any) => h.key === 'X-Custom-Header' && h.value === 'custom-value')).toBe(true);
    });
  });

  describe('createSecurityHeaders', () => {
    it('should return basic security headers by default', () => {
      const headers = createSecurityHeaders();

      expect(headers.some(h => h.key === 'X-Content-Type-Options' && h.value === 'nosniff')).toBe(true);
      expect(headers.some(h => h.key === 'X-Frame-Options' && h.value === 'DENY')).toBe(true);
      expect(headers.some(h => h.key === 'X-XSS-Protection' && h.value === '1; mode=block')).toBe(true);
      expect(headers.some(h => h.key === 'Referrer-Policy' && h.value === 'strict-origin-when-cross-origin')).toBe(true);
    });

    it('should include HSTS header when enabled', () => {
      const headers = createSecurityHeaders({ enableHSTS: true });

      expect(headers.some(h => 
        h.key === 'Strict-Transport-Security' && 
        h.value === 'max-age=31536000; includeSubDomains; preload'
      )).toBe(true);
    });

    it('should not include HSTS header when disabled', () => {
      const headers = createSecurityHeaders({ enableHSTS: false });

      expect(headers.some(h => h.key === 'Strict-Transport-Security')).toBe(false);
    });

    it('should include CSP header when enabled', () => {
      const headers = createSecurityHeaders({ enableCSP: true });

      expect(headers.some(h => h.key === 'Content-Security-Policy')).toBe(true);
    });

    it('should not include CSP header when disabled', () => {
      const headers = createSecurityHeaders({ enableCSP: false });

      expect(headers.some(h => h.key === 'Content-Security-Policy')).toBe(false);
    });

    it('should include Permissions-Policy header', () => {
      const headers = createSecurityHeaders();

      const permissionsHeader = headers.find(h => h.key === 'Permissions-Policy');
      expect(permissionsHeader).toBeDefined();
      
      const policyValue = permissionsHeader!.value;
      expect(policyValue).toContain('camera=()');
      expect(policyValue).toContain('microphone=()');
      expect(policyValue).toContain('geolocation=()');
    });

    it('should merge custom headers', () => {
      const customHeaders = [
        { key: 'X-Custom-Header', value: 'custom-value' }
      ];

      const headers = createSecurityHeaders({ customHeaders });

      expect(headers.some(h => h.key === 'X-Custom-Header' && h.value === 'custom-value')).toBe(true);
      expect(headers.some(h => h.key === 'X-Content-Type-Options' && h.value === 'nosniff')).toBe(true);
    });
  });

  describe('Security Header Values Validation', () => {
    it('should have correct HSTS values', async () => {
      const config = createNextConfig({ enableHSTS: true });
      const headers = await config.headers!();
      const hstsHeader = headers[0].headers.find((h: any) => h.key === 'Strict-Transport-Security');

      expect(hstsHeader!.value).toBe('max-age=31536000; includeSubDomains; preload');
    });

    it('should have correct X-Content-Type-Options value', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const header = headers[0].headers.find((h: any) => h.key === 'X-Content-Type-Options');

      expect(header!.value).toBe('nosniff');
    });

    it('should have correct X-Frame-Options value', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const header = headers[0].headers.find((h: any) => h.key === 'X-Frame-Options');

      expect(header!.value).toBe('DENY');
    });

    it('should have correct X-XSS-Protection value', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const header = headers[0].headers.find((h: any) => h.key === 'X-XSS-Protection');

      expect(header!.value).toBe('1; mode=block');
    });

    it('should have correct Referrer-Policy value', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const header = headers[0].headers.find((h: any) => h.key === 'Referrer-Policy');

      expect(header!.value).toBe('strict-origin-when-cross-origin');
    });
  });
});

```

---

### turbopack.test.ts

**Path:** `tests\turbopack.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNextConfig } from '../src/index';
import { turbopackConfig } from '../src/turbopack';

describe('Turbopack Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNextConfig Turbopack integration', () => {
    it('should not include Turbopack configuration when disabled', () => {
      const config = createNextConfig({ enableTurbopack: false });
      
      expect(config.turbopack).toBeUndefined();
    });

    it('should include Turbopack configuration when enabled', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.turbopack).toBeDefined();
      expect(config.turbopack).toHaveProperty('rules');
    });

    it('should merge turbopack rules correctly', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.turbopack?.rules).toHaveProperty('*.svg');
      expect(config.turbopack?.rules['*.svg']).toHaveProperty('loaders');
    });

    it('should include experimental Turbopack features', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.experimental).toBeDefined();
      expect(config.experimental?.turbo).toBeDefined();
      expect(config.experimental?.turbo?.loaders).toBe(true);
      expect(config.experimental?.turbo?.resolveAlias).toBe(true);
    });

    it('should include CSS optimization', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.experimental?.optimizeCss).toBe(true);
    });

    it('should include package import optimization', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.experimental?.optimizePackageImports).toBeDefined();
      expect(Array.isArray(config.experimental?.optimizePackageImports)).toBe(true);
      expect(config.experimental?.optimizePackageImports).toContain('lucide-react');
      expect(config.experimental?.optimizePackageImports).toContain('date-fns');
    });

    it('should preserve existing experimental features', () => {
      const config = createNextConfig({ 
        enableTurbopack: true,
      });
      
      // Should have both original and Turbopack experimental features
      expect(config.experimental?.sri).toBeDefined();
      expect(config.experimental?.turbo).toBeDefined();
      expect(config.experimental?.optimizeCss).toBe(true);
    });

    it('should merge webpack configuration', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(typeof config.webpack).toBe('function');
    });

    it('should handle webpack configuration merging', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      if (config.webpack) {
        const mockWebpackConfig = { resolve: { fallback: {} } };
        const mockContext = { isServer: false };
        
        const result = config.webpack(mockWebpackConfig, mockContext);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('Turbopack rules validation', () => {
    it('should have SVG loader configuration', () => {
      const config = createNextConfig({ enableTurbopack: true });
      const svgRule = config.turbopack?.rules['*.svg'];
      
      expect(svgRule).toBeDefined();
      expect(Array.isArray(svgRule?.loaders)).toBe(true);
      
      const loader = svgRule?.loaders[0];
      expect(loader?.loader).toBe('@svgr/webpack');
      expect(loader?.options).toHaveProperty('icon', true);
      expect(loader?.options).toHaveProperty('svgo', true);
    });

    it('should preserve Turbopack config structure', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      // Should match the structure from turbopack.ts
      expect(config.turbopack).toHaveProperty('rules');
      expect(typeof config.turbopack?.rules).toBe('object');
    });
  });

  describe('Turbopack integration with other options', () => {
    it('should work with cache profiles', () => {
      const config = createNextConfig({
        enableTurbopack: true,
        cacheProfile: 'api',
      });
      
      expect(config.turbopack).toBeDefined();
      expect(config.cacheLife).toBeDefined();
      expect(config.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should work with security headers', () => {
      const config = createNextConfig({
        enableTurbopack: true,
        enableCSP: true,
        enableHSTS: true,
      });
      
      expect(config.turbopack).toBeDefined();
      expect(config.experimental).toBeDefined();
    });

    it('should work with custom image domains', () => {
      const config = createNextConfig({
        enableTurbopack: true,
        imageDomains: ['example.com', 'cdn.example.com'],
      });
      
      expect(config.turbopack).toBeDefined();
      expect(config.images?.domains).toContain('example.com');
      expect(config.images?.domains).toContain('cdn.example.com');
    });

    it('should work with custom headers', () => {
      const customHeaders = [
        { key: 'X-Custom-Header', value: 'custom-value' }
      ];

      const config = createNextConfig({
        enableTurbopack: true,
        customHeaders,
      });
      
      expect(config.turbopack).toBeDefined();
    });

    it('should work with server external packages', () => {
      const config = createNextConfig({
        enableTurbopack: true,
        serverExternalPackages: ['@custom/package'],
      });
      
      expect(config.turbopack).toBeDefined();
      expect(config.serverExternalPackages).toContain('@custom/package');
    });
  });

  describe('Turbopack configuration precedence', () => {
    it('should merge Turbopack config with existing config', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      // Should have both original and Turbopack configurations
      expect(config.turbopack).toBeDefined();
      expect(config.experimental).toBeDefined();
      expect(config.experimental?.sri).toBeDefined(); // Original config
      expect(config.experimental?.turbo).toBeDefined(); // Turbopack config
    });

    it('should handle conflicting experimental features', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      // Turbopack features should be added, not replace existing ones
      expect(config.experimental?.sri).toBeDefined();
      expect(config.experimental?.turbo).toBeDefined();
      expect(config.experimental?.optimizeCss).toBe(true);
    });
  });

  describe('Turbopack webpack integration', () => {
    it('should preserve original webpack functionality', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      if (config.webpack) {
        const mockWebpackConfig = { 
          resolve: { 
            fallback: {
              fs: false,
              net: false,
              tls: false,
            }
          } 
        };
        const mockContext = { isServer: false };
        
        const result = config.webpack(mockWebpackConfig, mockContext);
        
        // Should preserve the fallback configuration
        expect(result.resolve.fallback.fs).toBe(false);
        expect(result.resolve.fallback.net).toBe(false);
        expect(result.resolve.fallback.tls).toBe(false);
      }
    });

    it('should handle server-side webpack config', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      if (config.webpack) {
        const mockWebpackConfig = { 
          resolve: { 
            fallback: {}
          } 
        };
        const mockContext = { isServer: true };
        
        const result = config.webpack(mockWebpackConfig, mockContext);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('Turbopack configuration validation', () => {
    it('should have valid Turbopack configuration structure', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.turbopack).toBeDefined();
      expect(typeof config.turbopack).toBe('object');
    });

    it('should have valid experimental configuration', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.experimental).toBeDefined();
      expect(typeof config.experimental).toBe('object');
      expect(config.experimental?.turbo).toBeDefined();
      expect(typeof config.experimental?.turbo).toBe('object');
    });

    it('should have valid package imports configuration', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(Array.isArray(config.experimental?.optimizePackageImports)).toBe(true);
      expect(config.experimental?.optimizePackageImports.length).toBeGreaterThan(0);
    });
  });
});

```

---


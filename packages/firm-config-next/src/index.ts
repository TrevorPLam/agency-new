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
      'drizzle-orm',
      'postgres',
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

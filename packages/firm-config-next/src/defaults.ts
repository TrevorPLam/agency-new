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

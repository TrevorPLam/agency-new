/**
 * Next.js Configuration Template with Observability Support
 * 
 * This template includes the necessary configuration for Next.js 16+ 
 * to use the instrumentation.ts file for observability initialization.
 * 
 * Apps should copy this file to their root as next.config.js and
 * customize as needed.
 */

const { createConfig } = require('@firm/config-next')

/** @type {import('next').NextConfig} */
const nextConfig = createConfig({
  // Enable the instrumentation hook for observability
  experimental: {
    instrumentationHook: true,
  },
  
  // Environment variables that should be available on the client side
  // (Add any client-side env vars here as needed)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Additional Next.js configurations can be added here
  
  // Example: Custom headers for security
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
        ],
      },
    ]
  },
  
  // Example: Redirects
  async redirects() {
    return [
      // Add redirects as needed
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ]
  },
})

module.exports = nextConfig

/**
 * Next.js Configuration for Observability Demo
 * 
 * This configuration enables the instrumentation hook for observability.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable the instrumentation hook for observability
  experimental: {
    instrumentationHook: true,
  },
  
  // Environment variables for client side (if needed)
  env: {
    NEXT_PUBLIC_APP_NAME: 'Observability Demo',
  },
}

module.exports = nextConfig

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

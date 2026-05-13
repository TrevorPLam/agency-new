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

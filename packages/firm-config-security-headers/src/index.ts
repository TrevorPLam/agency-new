export interface SecurityHeadersOptions {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  baseUri?: string;
  customDirectives?: Record<string, string[]>;
}

export function createSecurityHeaders(options: SecurityHeadersOptions = {}) {
  const {
    enableCSP = true,
    enableHSTS = true,
    baseUri = 'self',
    customDirectives = {},
  } = options;

  const directives: Record<string, string> = {
    'default-src': "'none'",
    'base-uri': baseUri === 'self' ? "'self'" : baseUri,
    'frame-ancestors': "'none'",
    'form-action': "'self'",
    'block-all-mixed-content': '',
    'upgrade-insecure-requests': '',
    'script-src': "'self'",
  };

  const mergedDirectives = {
    ...directives,
    ...Object.fromEntries(
      Object.entries(customDirectives).map(([key, values]) => [key, values.join(' ')])
    ),
  };

  const headers = [
    ...(enableHSTS
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ]
      : []),
    {
      key: 'Referrer-Policy',
      value: 'no-referrer',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'Permissions-Policy',
      value: 'geolocation=(), microphone=(), camera=()',
    },
    ...(enableCSP
      ? [
          {
            key: 'Content-Security-Policy',
            value: Object.entries(mergedDirectives)
              .map(([directive, value]) => `${directive} ${value}`)
              .join('; '),
          },
        ]
      : []),
  ]; 

  return { headers };
}

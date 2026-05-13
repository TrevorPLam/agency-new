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

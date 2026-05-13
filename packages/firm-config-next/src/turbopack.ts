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

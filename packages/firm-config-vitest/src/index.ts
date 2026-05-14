import type { UserConfig } from 'vitest';

export interface VitestConfigOptions {
  coverageThreshold?: number;
  environment?: 'node' | 'jsdom' | 'happy-dom';
  include?: string[];
  exclude?: string[];
  watch?: boolean;
}

export function createVitestConfig(options: VitestConfigOptions = {}): UserConfig {
  const {
    coverageThreshold = 80,
    environment = 'node',
    include = ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude = ['node_modules', 'dist'],
    watch = false,
  } = options;

  return {
    test: {
      environment,
      include,
      exclude,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary'],
        statements: coverageThreshold,
        branches: coverageThreshold,
        functions: coverageThreshold,
        lines: coverageThreshold,
      },
      watch,
    },
  };
}

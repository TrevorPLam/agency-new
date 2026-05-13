import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

import type { Linter } from 'eslint';

type FlatConfig = {
  files?: string | string[];
  languageOptions?: {
    ecmaVersion?: Linter.EcmaVersion | 'latest';
    sourceType?: 'script' | 'module';
    globals?: Record<string, boolean>;
    parser?: any;
    parserOptions?: any;
  };
  plugins?: Record<string, any>;
  rules?: Record<string, any>;
  settings?: Record<string, any>;
};

import { createBasePreset } from './presets/base';
import { createTypeScriptPreset } from './presets/typescript';
import { createReactPreset } from './presets/react';
import { createNextJSPreset } from './presets/nextjs';
import { createBoundariesPreset } from './presets/boundaries';
import { createImportsPreset } from './presets/imports';

export interface ConfigOptions {
  /**
   * Enable TypeScript-specific rules
   * @default true
   */
  typescript?: boolean;
  
  /**
   * Enable React-specific rules
   * @default false
   */
  react?: boolean;
  
  /**
   * Enable Next.js-specific rules
   * @default false
   */
  nextjs?: boolean;
  
  /**
   * Enable boundaries rules for layer restrictions
   * @default true
   */
  boundaries?: boolean;
  
  /**
   * Enable import organization rules
   * @default true
   */
  imports?: boolean;
}

/**
 * Creates a complete ESLint flat config array with the specified options.
 * 
 * @param options - Configuration options
 * @returns ESLint flat config array
 */
export function createConfig(options: ConfigOptions = {}): FlatConfig[] {
  const {
    typescript = true,
    react = false,
    nextjs = false,
    boundaries = true,
    imports = true,
  } = options;

  const configs: FlatConfig[] = [
    // Always include base configuration
    ...createBasePreset(),
  ];

  // Add optional presets
  if (typescript) {
    configs.push(...createTypeScriptPreset());
  }

  if (react) {
    configs.push(...createReactPreset());
  }

  if (nextjs) {
    configs.push(...createNextJSPreset());
  }

  if (boundaries) {
    configs.push(...createBoundariesPreset());
  }

  if (imports) {
    configs.push(...createImportsPreset());
  }

  // Add prettier config last to override any conflicting rules
  configs.push(prettierConfig);

  return configs;
}

/**
 * Default configuration with TypeScript, boundaries, and imports enabled.
 */
export const defaultConfig: FlatConfig[] = createConfig();

/**
 * Configuration for React applications.
 */
export const reactConfig: FlatConfig[] = createConfig({ react: true });

/**
 * Configuration for Next.js applications.
 */
export const nextjsConfig: FlatConfig[] = createConfig({ react: true, nextjs: true });

/**
 * Configuration for Node.js services.
 */
export const serviceConfig: FlatConfig[] = createConfig({ react: false, nextjs: false });

// Export individual presets for advanced composition
export {
  createBasePreset,
  createTypeScriptPreset,
  createReactPreset,
  createNextJSPreset,
  createBoundariesPreset,
  createImportsPreset,
};

// Re-export typescript-eslint config helper for compatibility
export const config: typeof tseslint.config = tseslint.config;

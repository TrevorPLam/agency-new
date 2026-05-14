import { describe, expect, it } from 'vitest';
import { createStorybookConfig } from '../src/index';

describe('createStorybookConfig', () => {
  it('returns a storybook config with the expected builder', () => {
    const config = createStorybookConfig();

    expect(config.core.builder).toBe('storybook-builder-vite');
    expect(config.stories).toContain('../src/**/*.stories.@(js|jsx|ts|tsx|mdx)');
  });
});

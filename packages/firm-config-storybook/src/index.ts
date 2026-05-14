export interface StorybookConfigOptions {
  builder?: 'storybook-builder-vite' | 'webpack5';
  theme?: string;
  addons?: string[];
  docs?: boolean;
}

export function createStorybookConfig(options: StorybookConfigOptions = {}) {
  const {
    builder = 'storybook-builder-vite',
    theme = 'light',
    addons = ['@storybook/addon-links', '@storybook/addon-essentials'],
    docs = true,
  } = options;

  return {
    stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
    addons,
    framework: {
      name: '@storybook/react-vite',
      options: {},
    },
    core: {
      builder,
    },
    docs: {
      autodocs: docs ? 'tag' : false,
    },
    typescript: {
      reactDocgen: 'react-docgen-typescript',
    },
    theme,
  };
}

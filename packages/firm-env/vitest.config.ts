import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [],
    // Allow process.env manipulation in tests
    env: {
      NODE_ENV: 'test',
    },
  },
});

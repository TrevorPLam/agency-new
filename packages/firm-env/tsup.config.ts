import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['zod', '@t3-oss/env-nextjs'],
  splitting: false,
  sourcemap: true,
  minify: false,
  tsconfig: './tsconfig.json',
});

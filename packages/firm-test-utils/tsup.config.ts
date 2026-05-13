import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/factories.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['zod'],
})

import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    openapi: 'src/openapi.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['zod', '@asteasolutions/zod-to-openapi']
})

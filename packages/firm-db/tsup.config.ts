import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'schemas/index': 'src/schemas/index.ts',
    'connection/index': 'src/connection/index.ts',
    'helpers/index': 'src/helpers/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['drizzle-orm', 'pg', 'postgres']
})

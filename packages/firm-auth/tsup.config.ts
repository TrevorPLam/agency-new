import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'session/index': 'src/session/index.ts',
    'permissions/index': 'src/permissions/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['@firm/types', '@firm/db', '@firm/crypto', '@firm/errors', '@firm/validators']
})

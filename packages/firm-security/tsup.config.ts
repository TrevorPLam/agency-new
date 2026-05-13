import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'csp': 'src/csp/index.ts',
    'headers': 'src/headers/index.ts',
    'rate-limit': 'src/rate-limit/index.ts',
    'turnstile': 'src/turnstile/index.ts',
    'tags': 'src/tags/index.ts',
    'csrf': 'src/csrf/index.ts',
    'audit': 'src/audit/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['@firm/cache', '@firm/crypto', '@firm/types', '@firm/utils']
})

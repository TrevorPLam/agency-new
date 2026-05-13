import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'client': 'src/client.ts',
    'key-factory': 'src/key-factory.ts',
    'tags': 'src/tags.ts',
    'helpers': 'src/helpers.ts',
    'ttl-policies': 'src/ttl-policies.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['ioredis']
})

import type { Config } from 'drizzle-kit'
import { tenantScopedTables, applyRLSPolicy } from './src/schemas/rls-policies'
import { createDirectConnection, getDatabaseConfig } from './src/connection/factories'
import { sql } from 'drizzle-orm'

export default {
  schema: './src/schemas',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  // Schema filtering for multi-tenant architecture
  schemaFilter: ['public'],
  // Custom migration hooks for RLS policies
  hooks: {
    beforeMigrate: async () => {
      console.log('🔒 Applying RLS-enabled migrations...')
    },
    afterMigrate: async () => {
      const requireRLS = process.env.REQUIRE_RLS !== 'false'
      
      if (!requireRLS) {
        console.log('⚠️  RLS enforcement skipped (REQUIRE_RLS=false)')
        return
      }

      console.log('🔒 Applying Row Level Security policies...')
      
      try {
        const config = getDatabaseConfig()
        const db = createDirectConnection(config)
        
        // Apply RLS policies to all tenant-scoped tables
        for (const table of tenantScopedTables) {
          console.log(`📋 Applying RLS to ${table}...`)
          await db.execute(applyRLSPolicy(table))
        }
        
        console.log('✅ RLS policies applied successfully')
        console.log(`📊 Protected tables: ${tenantScopedTables.join(', ')}`)
      } catch (error) {
        console.error('❌ Failed to apply RLS policies:', error)
        throw new Error(`RLS policy application failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  },
  // Migration naming convention
  migrationsPrefix: '',
  migrationsSuffix: '.sql',
  // Statement timeout (in milliseconds)
  statementTimeout: 30000,
  // Allow running migrations in production
  force: false,
} satisfies Config

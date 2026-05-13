#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * CI script to check for OpenAPI breaking changes using oasdiff
 * This script is designed to run in CI environments
 */

function main() {
  try {
    console.log('🔍 Checking for OpenAPI breaking changes...')
    
    // Generate current OpenAPI document
    console.log('📝 Generating current OpenAPI document...')
    execSync('npm run build', { stdio: 'inherit' })
    execSync('node dist/openapi.js', { stdio: 'inherit' })
    
    // Check if previous version exists
    const currentPath = 'openapi.json'
    const previousPath = 'openapi-prev.json'
    
    if (!existsSync(currentPath)) {
      console.log('❌ Current OpenAPI document not found')
      process.exit(1)
    }
    
    if (!existsSync(previousPath)) {
      console.log('ℹ️  No previous version found, skipping diff check')
      process.exit(0)
    }
    
    // Run oasdiff to check for breaking changes
    console.log('🔍 Running oasdiff to check for breaking changes...')
    try {
      const diffOutput = execSync(
        `npx oasdiff breaking ${previousPath} ${currentPath}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      )
      
      if (diffOutput.trim()) {
        console.log('⚠️  Breaking changes detected:')
        console.log(diffOutput)
        console.log('')
        console.log('💡 To update the baseline, run:')
        console.log('   cp openapi.json openapi-prev.json')
        console.log('')
        console.log('🚨 CI check failed due to breaking changes')
        process.exit(1)
      } else {
        console.log('✅ No breaking changes detected')
      }
    } catch (error: any) {
      // oasdiff exits with non-zero code when breaking changes are found
      if (error.stdout) {
        console.log('⚠️  Breaking changes detected:')
        console.log(error.stdout)
        console.log('')
        console.log('💡 To update the baseline, run:')
        console.log('   cp openapi.json openapi-prev.json')
        console.log('')
        console.log('🚨 CI check failed due to breaking changes')
        process.exit(1)
      } else {
        console.log('❌ Error running oasdiff:', error.message)
        process.exit(1)
      }
    }
    
    console.log('✅ OpenAPI change check passed')
    
  } catch (error: any) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

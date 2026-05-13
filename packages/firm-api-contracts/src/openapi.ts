import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { OpenApiComponents, LeadOpenApiRoutes, FormOpenApiRoutes } from './routes/openapi'
import { BookingOpenApiRoutes } from './routes/booking-routes'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

extendZodWithOpenApi(z)

/**
 * OpenAPI registry for generating API documentation
 */
export const registry = new OpenAPIRegistry()

// Register common components
registry.registerComponent('securitySchemes', OpenApiComponents.securitySchemes)
registry.registerComponent('parameters', OpenApiComponents.parameters)
registry.registerComponent('schemas', OpenApiComponents.schemas)

// Register API routes
Object.entries(LeadOpenApiRoutes).forEach(([path, routeDef]) => {
  Object.entries(routeDef).forEach(([method, methodDef]) => {
    registry.registerPath({
      method: method as 'get' | 'post' | 'put' | 'delete',
      path,
      ...methodDef as any
    })
  })
})

Object.entries(FormOpenApiRoutes).forEach(([path, routeDef]) => {
  Object.entries(routeDef).forEach(([method, methodDef]) => {
    registry.registerPath({
      method: method as 'get' | 'post' | 'put' | 'delete',
      path,
      ...methodDef as any
    })
  })
})

Object.entries(BookingOpenApiRoutes).forEach(([path, routeDef]) => {
  Object.entries(routeDef).forEach(([method, methodDef]) => {
    registry.registerPath({
      method: method as 'get' | 'post' | 'put' | 'delete',
      path,
      ...methodDef as any
    })
  })
})

/**
 * Generate OpenAPI document
 */
export function generateOpenAPIDocument() {
  return registry.generateDocument({
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Firm Platform API',
      description: 'RESTful API for the Firm agency platform',
      contact: {
        name: 'Firm Platform Team',
        email: 'api@firm.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://api.firm.com',
        description: 'Production server'
      },
      {
        url: 'https://staging-api.firm.com',
        description: 'Staging server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Leads',
        description: 'Lead management operations'
      },
      {
        name: 'Forms',
        description: 'Form submission and management'
      },
      {
        name: 'Bookings',
        description: 'Booking and appointment management'
      }
    ],
    security: [
      {
        bearerAuth: []
      },
      {
        apiKeyAuth: []
      }
    ]
  })
}

/**
 * Write OpenAPI document to file
 */
export function writeOpenAPIDocument(filePath: string = 'openapi.json') {
  const document = generateOpenAPIDocument()
  
  // Write previous version for comparison if it exists
  if (existsSync(filePath)) {
    const currentDoc = readFileSync(filePath, 'utf-8')
    writeFileSync('openapi-prev.json', currentDoc, 'utf-8')
  }
  
  // Write current OpenAPI document
  writeFileSync(filePath, JSON.stringify(document, null, 2), 'utf-8')
  
  return document
}

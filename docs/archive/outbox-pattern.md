# Transactional Outbox Pattern

This document describes the implementation of the transactional outbox pattern for reliable event delivery in the Firm Platform.

## Overview

The transactional outbox pattern solves the problem of ensuring that domain events are reliably published to external systems (Inngest, webhooks, etc.) even if the application crashes after a database write succeeds but before event publication completes.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Business      │    │   Outbox Table   │    │   Event Worker  │
│   Logic         │───▶│   (same TX)      │───▶│   (separate)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Database      │    │   Events Stored  │    │   Events Pub.   │
│   Transaction   │    │   Reliably       │    │   to External   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementation

### Database Schema

The outbox pattern is implemented through the `outbox_events` table in `packages/firm-db/src/schemas/outbox-events.ts`:

```typescript
export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  eventSource: text('event_source').notNull(),
  eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
  tenantId: uuid('tenant_id').notNull(),
  eventData: jsonb('event_data').notNull(),
  status: text('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  // ... additional fields
})
```

### Key Features

- **Atomic Operations**: Events are inserted in the same transaction as business data
- **Retry Logic**: Exponential backoff with configurable max attempts
- **Status Tracking**: Events transition through pending → processing → completed/failed
- **Multi-tenant**: All events are scoped to tenant ID
- **Monitoring**: Built-in statistics and health checks

## Usage

### Basic Event Emission

```typescript
import { emitEvent } from '@firm/db'

// In your business logic transaction
async function createLead(data: CreateLeadData) {
  return await db.transaction(async (tx) => {
    // 1. Create the business entity
    const lead = await tx.insert(leads).values(data).returning()
    
    // 2. Emit the event in the same transaction
    await emitEvent(tx, {
      data: { leadId: lead.id, email: lead.email },
      type: 'lead.created',
      source: 'firm.crm',
      tenantId: data.tenantId,
      correlationId: requestContext.correlationId
    })
    
    return lead
  })
}
```

### Multiple Events

```typescript
import { emitEvents } from '@firm/db'

async function bulkUpdateLeads(updates: LeadUpdate[]) {
  return await db.transaction(async (tx) => {
    const events = []
    
    for (const update of updates) {
      const lead = await tx.update(leads)
        .set(update.data)
        .where(eq(leads.id, update.id))
        .returning()
      
      events.push({
        data: { leadId: lead.id, changes: update.data },
        type: 'lead.updated',
        source: 'firm.crm',
        tenantId: update.tenantId
      })
    }
    
    // Emit all events atomically
    await emitEvents(tx, events)
    
    return leads
  })
}
```

### Event Worker Implementation

```typescript
import { 
  getPendingEvents, 
  markEventAsProcessing, 
  markEventAsCompleted,
  markEventAsFailed 
} from '@firm/db'

async function processOutboxEvents() {
  const events = await getPendingEvents(db, { limit: 50 })
  
  for (const event of events) {
    try {
      // Mark as processing to prevent duplicate work
      await markEventAsProcessing(db, event.id)
      
      // Publish to external system (Inngest, webhook, etc.)
      await publishEvent(event)
      
      // Mark as completed
      await markEventAsCompleted(db, event.id)
      
    } catch (error) {
      // Mark as failed with retry logic
      await markEventAsFailed(db, event.id, error.message)
    }
  }
}
```

### Monitoring and Health Checks

```typescript
import { getEventStatistics } from '@firm/db'

async function checkOutboxHealth() {
  const stats = await getEventStatistics(db)
  
  // Alert if too many failed events
  if (stats.failed > 100) {
    await alertTeam('High number of failed outbox events')
  }
  
  // Alert if pending events backlog is growing
  if (stats.pending > 1000) {
    await alertTeam('Outbox events backlog growing')
  }
  
  return {
    healthy: stats.failed < 10 && stats.pending < 500,
    stats
  }
}
```

## Configuration

### Default Settings

```typescript
export const DEFAULT_OUTBOX_CONFIG = {
  maxAttempts: 3,
  initialRetryDelay: 1000, // 1 second
  maxRetryDelay: 300000, // 5 minutes
  retryBackoffMultiplier: 2,
}
```

### Custom Retry Logic

```typescript
await emitEvent(db, {
  data: { /* event data */ },
  type: 'critical.event',
  source: 'firm.billing',
  tenantId: 'tenant-123',
  maxAttempts: 5 // Override default for critical events
})
```

## Worker Service

A separate worker service should be implemented to:

1. **Poll for Events**: Use `getPendingEvents()` to fetch events ready for processing
2. **Process Events**: Publish to external systems (Inngest, webhooks, message queues)
3. **Update Status**: Mark events as completed or failed
4. **Handle Retries**: Implement exponential backoff for failed events
5. **Cleanup**: Remove old completed events to prevent table growth

### Worker Best Practices

- **Batch Processing**: Process multiple events per batch for efficiency
- **Idempotency**: Ensure event publishing is idempotent
- **Dead Letter Queue**: Route events that exceed max attempts to DLQ
- **Monitoring**: Track processing metrics and alert on issues
- **Graceful Shutdown**: Handle SIGTERM for clean shutdown

## Database Migration

The outbox table will be automatically created when you run database migrations:

```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

## Performance Considerations

### Indexing

The outbox table includes optimized indexes for common queries:

- `pending_events_idx`: For worker polling
- `tenant_events_idx`: For tenant-specific queries
- `event_type_idx`: For event type filtering

### Cleanup Strategy

Implement regular cleanup of completed events:

```typescript
// Run daily cleanup of events older than 7 days
await cleanupCompletedEvents(db, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
```

### Scaling

- **Horizontal Scaling**: Multiple worker instances can process events concurrently
- **Partitioning**: Consider table partitioning by tenant for very large deployments
- **Connection Pooling**: Use appropriate database connection pooling

## Testing

The outbox functionality includes comprehensive tests in `packages/firm-db/tests/outbox.test.ts`:

```bash
# Run outbox tests
pnpm test outbox.test.ts
```

## Security Considerations

- **Tenant Isolation**: All events are scoped to tenant ID
- **Data Validation**: Event data is stored as JSON with schema validation
- **Audit Trail**: All event processing is logged with timestamps
- **Access Control**: Worker should have minimal required permissions

## Troubleshooting

### Common Issues

1. **Events Not Processing**: Check worker is running and has database connectivity
2. **High Failed Events**: Review error messages and external system connectivity
3. **Performance Issues**: Check database indexes and query performance
4. **Memory Issues**: Implement proper cleanup of completed events

### Debug Queries

```sql
-- Check pending events
SELECT * FROM outbox_events WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;

-- Check failed events
SELECT * FROM outbox_events WHERE status = 'failed' ORDER BY updated_at DESC LIMIT 10;

-- Event statistics by tenant
SELECT tenant_id, status, COUNT(*) FROM outbox_events GROUP BY tenant_id, status;
```

## Migration Path

### From Direct Event Publishing

1. **Phase 1**: Deploy outbox table and emitEvent helper
2. **Phase 2**: Update services to use emitEvent instead of direct publishing
3. **Phase 3**: Deploy event worker to process outbox events
4. **Phase 4**: Remove direct event publishing code

### Backward Compatibility

The outbox pattern can be deployed alongside existing event publishing:

```typescript
// Gradual migration
const useOutbox = process.env.USE_OUTBOX === 'true'

if (useOutbox) {
  await emitEvent(db, eventOptions)
} else {
  await publishEventDirectly(eventOptions)
}
```

## Future Enhancements

- **Event Versioning**: Support for event schema evolution
- **Priority Queuing**: High-priority events processed first
- **Event Replay**: Ability to replay events for debugging
- **Multi-Region**: Cross-region event replication
- **Event Sourcing**: Complete event history for entities

import type { TenantCache } from './client'
import type { CacheKeyFactory } from './key-factory'
import type { TagManager } from './tags'

/**
 * Cache-aside pattern helper
 * 
 * Provides a simple way to implement cache-aside pattern
 * with automatic cache management and fallback logic.
 */
export interface CacheAsideOptions<T> {
  keyFactory: CacheKeyFactory
  ttlSeconds?: number
  tags?: string[]
  fallback?: () => Promise<T>
}

/**
 * Cache-aside helper function
 * 
 * Wraps a data fetching function with caching logic.
 * Returns cached data if available, otherwise fetches and caches.
 */
export async function withCache<T>(
  cache: TenantCache,
  options: CacheAsideOptions<T>,
  fetcher: () => Promise<T>
): Promise<T> {
  const { keyFactory, ttlSeconds, tags, fallback } = options
  
  // Try to get from cache first
  const cached = await cache.get<T>(keyFactory.key(['cache']))
  
  if (cached !== null) {
    return cached
  }
  
  // If no cached data and fallback provided, use fallback
  if (fallback) {
    try {
      const fallbackData = await fallback()
      
      // Cache the fallback data for future requests
      if (ttlSeconds || tags) {
        await cache.set(
          keyFactory.key(['cache']),
          fallbackData,
          ttlSeconds,
          tags
        )
      }
      
      return fallbackData
    } catch (error) {
      // If fallback fails, return null or rethrow based on strategy
      console.warn('Cache fallback failed:', error)
      throw error
    }
  }
  
  // No cached data and no fallback, return null
  return null as T
}

/**
 * Cache-aside with refresh pattern
 * 
 * Similar to withCache but can refresh stale data
 * while serving fresh data from cache.
 */
export interface CacheAsideRefreshOptions<T> extends CacheAsideOptions<T> {
  staleWhileRevalidate?: boolean // Serve stale data while revalidating
  refreshThreshold?: number // Refresh if data is older than this many seconds
}

export async function withCacheRefresh<T>(
  cache: TenantCache,
  tagManager: TagManager,
  options: CacheAsideRefreshOptions<T>,
  fetcher: (currentData?: T) => Promise<T>
): Promise<T> {
  const { keyFactory, ttlSeconds, tags, staleWhileRevalidate, refreshThreshold } = options
  
  const cacheKey = keyFactory.key(['cache'])
  
  // Try to get from cache first
  const cached = await cache.get<T>(cacheKey)
  const now = Date.now()
  
  // If we have fresh data, return it
  if (cached !== null) {
    const cachedAge = (now - new Date(cached._cachedAt || '').getTime()) / 1000
    
    // Check if we need to refresh
    if (refreshThreshold && cachedAge > refreshThreshold) {
      // Start background refresh
      refreshInBackground(cache, tagManager, keyFactory, fetcher, cached)
    }
    
    return cached._data
  }
  
  // If we have stale data and staleWhileRevalidate is true, return it
  if (cached !== null && staleWhileRevalidate) {
    // Start background refresh
    refreshInBackground(cache, tagManager, keyFactory, fetcher, cached)
    
    return cached._data
  }
  
  // No cached data, fetch and cache it
  try {
    const freshData = await fetcher()
    
    // Cache the fresh data with metadata
    const cacheValue = {
      _data: freshData,
      _cachedAt: new Date().toISOString()
    }
    
    await cache.set(cacheKey, cacheValue as any, ttlSeconds, tags)
    
    return freshData
  } catch (error) {
    console.warn('Cache fetch failed:', error)
    throw error
  }
}

/**
 * Background refresh function
 * 
 * Refreshes cache data in the background without blocking
 * the current request.
 */
async function refreshInBackground<T>(
  cache: TenantCache,
  tagManager: TagManager,
  keyFactory: CacheKeyFactory,
  fetcher: (currentData?: T) => Promise<T>,
  currentData?: { _data: T; _cachedAt: string }
): Promise<void> {
  try {
    // Mark as refreshing to prevent race conditions
    const refreshKey = keyFactory.key(['refreshing'])
    const isRefreshing = await cache.exists(refreshKey)
    
    if (isRefreshing) {
      return // Already refreshing
    }
    
    // Set refresh lock
    await cache.set(refreshKey, 'true', 60) // 1 minute lock
    
    // Fetch fresh data
    const freshData = await fetcher(currentData?._data)
    
    // Update cache
    const cacheKey = keyFactory.key(['cache'])
    const cacheValue = {
      _data: freshData,
      _cachedAt: new Date().toISOString()
    }
    
    await cache.set(cacheKey, cacheValue as any)
    
    // Clear refresh lock
    await cache.del(refreshKey)
    
  } catch (error) {
    // Clear refresh lock even on error
    const refreshKey = keyFactory.key(['refreshing'])
    await cache.del(refreshKey)
    
    console.warn('Background refresh failed:', error)
  }
}

/**
 * Multi-get helper
 * 
 * Gets multiple values from cache efficiently
 */
export async function multiGet<T>(
  cache: TenantCache,
  keyFactory: CacheKeyFactory,
  keys: string[]
): Promise<Array<{ key: string; value: T | null }>> {
  const fullKeys = keys.map(key => keyFactory.key([key]))
  
  // Use Redis pipeline for efficiency
  const pipeline = cache.pipeline()
  const results = []
  
  for (const fullKey of fullKeys) {
    pipeline.get(fullKey)
  }
  
  const pipelineResults = await pipeline.exec()
  
  for (let i = 0; i < fullKeys.length; i++) {
    const result = pipelineResults[i]
    let value: T | null = null
    
    if (result && typeof result === 'string') {
      try {
        value = JSON.parse(result) as T
      } catch {
        // Invalid JSON, return as string
        value = result as unknown as T
      }
    }
    
    results.push({ key: keys[i], value })
  }
  
  return results
}

/**
 * Multi-set helper
 * 
 * Sets multiple values in cache efficiently
 */
export async function multiSet<T>(
  cache: TenantCache,
  keyFactory: CacheKeyFactory,
  items: Array<{ key: string; value: T; ttlSeconds?: number; tags?: string[] }>
): Promise<void> {
  const pipeline = cache.pipeline()
  
  for (const { key, value, ttlSeconds, tags } of items) {
    const fullKey = keyFactory.key([key])
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
    
    if (ttlSeconds) {
      pipeline.setex(fullKey, ttlSeconds, serializedValue)
    } else {
      pipeline.set(fullKey, serializedValue)
    }
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        pipeline.sadd(`tag:${tag}`, fullKey)
        pipeline.sadd(`tags:${key}`, ...tags)
      }
    }
  }
  
  await pipeline.exec()
}

/**
 * Cache warming helper
 * 
 * Pre-loads commonly accessed data into cache
 */
export async function warmCache<T>(
  cache: TenantCache,
  keyFactory: CacheKeyFactory,
  items: Array<{ key: string; value: T; ttlSeconds?: number; tags?: string[] }>
): Promise<void> {
  console.log(`Warming cache with ${items.length} items...`)
  
  await multiSet(cache, keyFactory, items)
  
  console.log('Cache warming completed')
}

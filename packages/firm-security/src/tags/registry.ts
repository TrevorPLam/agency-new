/**
 * Third-party script tag configuration
 */
export interface ScriptTag {
  /** Unique identifier for the script */
  id: string
  /** Script source URL */
  src: string
  /** Script category for consent management */
  category: 'necessary' | 'analytics' | 'marketing' | 'functional'
  /** Script name for display */
  name: string
  /** Script description */
  description?: string
  /** Whether script requires async loading */
  async?: boolean
  /** Whether script requires defer loading */
  defer?: boolean
  /** Integrity hash for SRI */
  integrity?: string
  /** Crossorigin attribute */
  crossorigin?: 'anonymous' | 'use-credentials'
  /** Script version */
  version?: string
  /** Required consent categories */
  requiredConsent?: string[]
}

/**
 * Tag registry for managing third-party scripts
 */
export class TagRegistry {
  private tags = new Map<string, ScriptTag>()
  private consentMappings = new Map<string, Set<string>>()

  /**
   * Register a new script tag
   */
  register(tag: ScriptTag): void {
    if (!tag.id || typeof tag.id !== 'string') {
      throw new Error('Script tag must have a valid id')
    }

    if (!tag.src || typeof tag.src !== 'string') {
      throw new Error('Script tag must have a valid src')
    }

    if (!this.isValidCategory(tag.category)) {
      throw new Error(`Invalid category: ${tag.category}`)
    }

    this.tags.set(tag.id, tag)

    // Update consent mappings
    const consentCategories = tag.requiredConsent || [tag.category]
    for (const category of consentCategories) {
      if (!this.consentMappings.has(category)) {
        this.consentMappings.set(category, new Set())
      }
      this.consentMappings.get(category)!.add(tag.id)
    }
  }

  /**
   * Get a script tag by ID
   */
  get(id: string): ScriptTag | undefined {
    return this.tags.get(id)
  }

  /**
   * Check if a tag is registered
   */
  has(id: string): boolean {
    return this.tags.has(id)
  }

  /**
   * Get all registered tags
   */
  getAll(): ScriptTag[] {
    return Array.from(this.tags.values())
  }

  /**
   * Get tags by category
   */
  getByCategory(category: string): ScriptTag[] {
    return this.getAll().filter(tag => tag.category === category)
  }

  /**
   * Get tags that require specific consent
   */
  getByConsent(consentCategory: string): ScriptTag[] {
    const tagIds = this.consentMappings.get(consentCategory)
    if (!tagIds) return []

    return Array.from(tagIds)
      .map(id => this.tags.get(id))
      .filter((tag): tag is ScriptTag => tag !== undefined)
  }

  /**
   * Remove a tag from registry
   */
  remove(id: string): boolean {
    const tag = this.tags.get(id)
    if (!tag) return false

    this.tags.delete(id)

    // Update consent mappings
    const consentCategories = tag.requiredConsent || [tag.category]
    for (const category of consentCategories) {
      const tagIds = this.consentMappings.get(category)
      if (tagIds) {
        tagIds.delete(id)
        if (tagIds.size === 0) {
          this.consentMappings.delete(category)
        }
      }
    }

    return true
  }

  /**
   * Validate tag configuration
   */
  validate(tag: Partial<ScriptTag>): boolean {
    return (
      typeof tag.id === 'string' &&
      tag.id.length > 0 &&
      typeof tag.src === 'string' &&
      tag.src.length > 0 &&
      this.isValidCategory(tag.category)
    )
  }

  /**
   * Get consent categories for a tag
   */
  getConsentCategories(id: string): string[] {
    const tag = this.tags.get(id)
    if (!tag) return []

    return tag.requiredConsent || [tag.category]
  }

  /**
   * Check if tag requires consent
   */
  requiresConsent(id: string, consentCategory: string): boolean {
    const categories = this.getConsentCategories(id)
    return categories.includes(consentCategory)
  }

  /**
   * Export registry configuration
   */
  export(): Record<string, ScriptTag> {
    const exported: Record<string, ScriptTag> = {}
    for (const [id, tag] of this.tags) {
      exported[id] = { ...tag }
    }
    return exported
  }

  /**
   * Import registry configuration
   */
  import(config: Record<string, ScriptTag>): void {
    for (const tag of Object.values(config)) {
      this.register(tag)
    }
  }

  /**
   * Clear all tags
   */
  clear(): void {
    this.tags.clear()
    this.consentMappings.clear()
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number
    byCategory: Record<string, number>
    byConsent: Record<string, number>
  } {
    const byCategory: Record<string, number> = {}
    const byConsent: Record<string, number> = {}

    for (const tag of this.tags.values()) {
      byCategory[tag.category] = (byCategory[tag.category] || 0) + 1

      const consentCategories = tag.requiredConsent || [tag.category]
      for (const category of consentCategories) {
        byConsent[category] = (byConsent[category] || 0) + 1
      }
    }

    return {
      total: this.tags.size,
      byCategory,
      byConsent
    }
  }

  private isValidCategory(category: string): category is ScriptTag['category'] {
    return ['necessary', 'analytics', 'marketing', 'functional'].includes(category)
  }
}

/**
 * Create a new tag registry instance
 */
export function createTagRegistry(): TagRegistry {
  return new TagRegistry()
}

/**
 * Default script tags for common third-party services
 */
export const DEFAULT_TAGS: Record<string, ScriptTag> = {
  'google-analytics': {
    id: 'google-analytics',
    src: 'https://www.googletagmanager.com/gtag/js',
    category: 'analytics',
    name: 'Google Analytics',
    description: 'Google Analytics for website analytics',
    async: true
  },
  'google-tag-manager': {
    id: 'google-tag-manager',
    src: 'https://www.googletagmanager.com/gtm.js',
    category: 'marketing',
    name: 'Google Tag Manager',
    description: 'Google Tag Manager for tag management',
    async: true
  },
  'facebook-pixel': {
    id: 'facebook-pixel',
    src: 'https://connect.facebook.net/en_US/fbevents.js',
    category: 'marketing',
    name: 'Facebook Pixel',
    description: 'Facebook Pixel for advertising analytics',
    defer: true
  },
  'hotjar': {
    id: 'hotjar',
    src: 'https://static.hotjar.com/c/hotjar-',
    category: 'analytics',
    name: 'Hotjar',
    description: 'Hotjar for user behavior analytics',
    async: true
  }
}

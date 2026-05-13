import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure nonce for CSP headers.
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * Creates a Content Security Policy header value with nonce placeholders.
 */
export function createCSPValue(options: {
  nonce?: string;
  enableStrict?: boolean;
  customDirectives?: Record<string, string[]>;
} = {}): string {
  const {
    nonce = '${nonce}',
    enableStrict = true,
    customDirectives = {},
  } = options;

  const directives: Record<string, string[]> = {
    // Default directives
    'default-src': ["'self'"],
    'script-src': ["'self'", `nonce-${nonce}`, "'strict-dynamic'"],
    'style-src': ["'self'", `nonce-${nonce}`],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  // Add strict mode directives
  if (enableStrict) {
    directives['object-src'] = ["'none'"];
    directives['require-trusted-types-for'] = ["'script'"];
    directives['trusted-types'] = [];
  }

  // Merge custom directives
  Object.assign(directives, customDirectives);

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * CSP directive builder for complex policies.
 */
export class CSPBuilder {
  private directives: Record<string, string[]> = {};

  /**
   * Add or update a CSP directive.
   */
  add(directive: string, sources: string[]): this {
    this.directives[directive] = sources;
    return this;
  }

  /**
   * Append sources to an existing directive.
   */
  append(directive: string, sources: string[]): this {
    if (!this.directives[directive]) {
      this.directives[directive] = [];
    }
    this.directives[directive]!.push(...sources);
    return this;
  }

  /**
   * Remove a CSP directive.
   */
  remove(directive: string): this {
    delete this.directives[directive];
    return this;
  }

  /**
   * Build final CSP header value.
   */
  build(nonce?: string): string {
    const processedSources = Object.entries(this.directives).map(([directive, sources]) => {
      const directiveSources = sources || [];
      const processedSources = directiveSources.map(source => 
        source.replace('${nonce}', nonce || '')
      );
      return `${directive} ${processedSources.join(' ')}`;
    });

    return processedSources.join('; ');
  }
}

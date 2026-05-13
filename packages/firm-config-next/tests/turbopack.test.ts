import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNextConfig } from '../src/index';
import { turbopackConfig } from '../src/turbopack';

describe('Turbopack Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNextConfig Turbopack integration', () => {
    it('should not include Turbopack configuration when disabled', () => {
      const config = createNextConfig({ enableTurbopack: false });
      
      expect(config.turbopack).toBeUndefined();
    });

    it('should include Turbopack configuration when enabled', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.turbopack).toBeDefined();
      expect(config.turbopack).toHaveProperty('rules');
    });

    it('should merge turbopack rules correctly', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.turbopack?.rules).toHaveProperty('*.svg');
      expect(config.turbopack?.rules['*.svg']).toHaveProperty('loaders');
    });

    it('should include experimental Turbopack features', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.experimental).toBeDefined();
      expect(config.experimental?.turbo).toBeDefined();
      expect(config.experimental?.turbo?.loaders).toBe(true);
      expect(config.experimental?.turbo?.resolveAlias).toBe(true);
    });

    it('should include CSS optimization', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.experimental?.optimizeCss).toBe(true);
    });

    it('should include package import optimization', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.experimental?.optimizePackageImports).toBeDefined();
      expect(Array.isArray(config.experimental?.optimizePackageImports)).toBe(true);
      expect(config.experimental?.optimizePackageImports).toContain('lucide-react');
      expect(config.experimental?.optimizePackageImports).toContain('date-fns');
    });

    it('should preserve existing experimental features', () => {
      const config = createNextConfig({ 
        enableTurbopack: true,
      });
      
      // Should have both original and Turbopack experimental features
      expect(config.experimental?.sri).toBeDefined();
      expect(config.experimental?.turbo).toBeDefined();
      expect(config.experimental?.optimizeCss).toBe(true);
    });

    it('should merge webpack configuration', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(typeof config.webpack).toBe('function');
    });

    it('should handle webpack configuration merging', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      if (config.webpack) {
        const mockWebpackConfig = { resolve: { fallback: {} } };
        const mockContext = { isServer: false };
        
        const result = config.webpack(mockWebpackConfig, mockContext);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('Turbopack rules validation', () => {
    it('should have SVG loader configuration', () => {
      const config = createNextConfig({ enableTurbopack: true });
      const svgRule = config.turbopack?.rules['*.svg'];
      
      expect(svgRule).toBeDefined();
      expect(Array.isArray(svgRule?.loaders)).toBe(true);
      
      const loader = svgRule?.loaders[0];
      expect(loader?.loader).toBe('@svgr/webpack');
      expect(loader?.options).toHaveProperty('icon', true);
      expect(loader?.options).toHaveProperty('svgo', true);
    });

    it('should preserve Turbopack config structure', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      // Should match the structure from turbopack.ts
      expect(config.turbopack).toHaveProperty('rules');
      expect(typeof config.turbopack?.rules).toBe('object');
    });
  });

  describe('Turbopack integration with other options', () => {
    it('should work with cache profiles', () => {
      const config = createNextConfig({
        enableTurbopack: true,
        cacheProfile: 'api',
      });
      
      expect(config.turbopack).toBeDefined();
      expect(config.cacheLife).toBeDefined();
      expect(config.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should work with security headers', () => {
      const config = createNextConfig({
        enableTurbopack: true,
        enableCSP: true,
        enableHSTS: true,
      });
      
      expect(config.turbopack).toBeDefined();
      expect(config.experimental).toBeDefined();
    });

    it('should work with custom image domains', () => {
      const config = createNextConfig({
        enableTurbopack: true,
        imageDomains: ['example.com', 'cdn.example.com'],
      });
      
      expect(config.turbopack).toBeDefined();
      expect(config.images?.domains).toContain('example.com');
      expect(config.images?.domains).toContain('cdn.example.com');
    });

    it('should work with custom headers', () => {
      const customHeaders = [
        { key: 'X-Custom-Header', value: 'custom-value' }
      ];

      const config = createNextConfig({
        enableTurbopack: true,
        customHeaders,
      });
      
      expect(config.turbopack).toBeDefined();
    });

    it('should work with server external packages', () => {
      const config = createNextConfig({
        enableTurbopack: true,
        serverExternalPackages: ['@custom/package'],
      });
      
      expect(config.turbopack).toBeDefined();
      expect(config.serverExternalPackages).toContain('@custom/package');
    });
  });

  describe('Turbopack configuration precedence', () => {
    it('should merge Turbopack config with existing config', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      // Should have both original and Turbopack configurations
      expect(config.turbopack).toBeDefined();
      expect(config.experimental).toBeDefined();
      expect(config.experimental?.sri).toBeDefined(); // Original config
      expect(config.experimental?.turbo).toBeDefined(); // Turbopack config
    });

    it('should handle conflicting experimental features', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      // Turbopack features should be added, not replace existing ones
      expect(config.experimental?.sri).toBeDefined();
      expect(config.experimental?.turbo).toBeDefined();
      expect(config.experimental?.optimizeCss).toBe(true);
    });
  });

  describe('Turbopack webpack integration', () => {
    it('should preserve original webpack functionality', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      if (config.webpack) {
        const mockWebpackConfig = { 
          resolve: { 
            fallback: {
              fs: false,
              net: false,
              tls: false,
            }
          } 
        };
        const mockContext = { isServer: false };
        
        const result = config.webpack(mockWebpackConfig, mockContext);
        
        // Should preserve the fallback configuration
        expect(result.resolve.fallback.fs).toBe(false);
        expect(result.resolve.fallback.net).toBe(false);
        expect(result.resolve.fallback.tls).toBe(false);
      }
    });

    it('should handle server-side webpack config', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      if (config.webpack) {
        const mockWebpackConfig = { 
          resolve: { 
            fallback: {}
          } 
        };
        const mockContext = { isServer: true };
        
        const result = config.webpack(mockWebpackConfig, mockContext);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    });
  });

  describe('Turbopack configuration validation', () => {
    it('should have valid Turbopack configuration structure', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.turbopack).toBeDefined();
      expect(typeof config.turbopack).toBe('object');
    });

    it('should have valid experimental configuration', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(config.experimental).toBeDefined();
      expect(typeof config.experimental).toBe('object');
      expect(config.experimental?.turbo).toBeDefined();
      expect(typeof config.experimental?.turbo).toBe('object');
    });

    it('should have valid package imports configuration', () => {
      const config = createNextConfig({ enableTurbopack: true });
      
      expect(Array.isArray(config.experimental?.optimizePackageImports)).toBe(true);
      expect(config.experimental?.optimizePackageImports.length).toBeGreaterThan(0);
    });
  });
});

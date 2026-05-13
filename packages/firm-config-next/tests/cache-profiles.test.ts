import { describe, it, expect } from 'vitest';
import { createNextConfig, defaultConfig, apiConfig, userFacingConfig, marketingConfig } from '../src/index';

describe('Cache Profiles Configuration', () => {
  describe('createNextConfig cacheLife profiles', () => {
    it('should include cacheLife configuration when cacheProfile is specified', () => {
      const config = createNextConfig({ cacheProfile: 'api' });
      
      expect(config.cacheLife).toBeDefined();
      expect(config.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should use homepage cache profile by default', () => {
      const config = createNextConfig();
      
      expect(config.cacheLife).toBeDefined();
      expect(config.cacheLife).toEqual({
        stale: 60,
        revalidate: 900,
        expire: 86400,
      });
    });

    it('should apply api cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'api' });
      
      expect(config.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should apply user cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'user' });
      
      expect(config.cacheLife).toEqual({
        stale: 300,
        revalidate: 3600,
        expire: 7200,
      });
    });

    it('should apply content cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'content' });
      
      expect(config.cacheLife).toEqual({
        stale: 3600,
        revalidate: 86400,
        expire: 172800,
      });
    });

    it('should apply analytics cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'analytics' });
      
      expect(config.cacheLife).toEqual({
        stale: 900,
        revalidate: 1800,
        expire: 3600,
      });
    });

    it('should apply images cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'images' });
      
      expect(config.cacheLife).toEqual({
        stale: 86400,
        revalidate: 604800,
        expire: 2592000,
      });
    });

    it('should apply short cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'short' });
      
      expect(config.cacheLife).toEqual({
        stale: 30,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should apply nocache cache profile correctly', () => {
      const config = createNextConfig({ cacheProfile: 'nocache' });
      
      expect(config.cacheLife).toEqual({
        stale: 0,
        revalidate: 0,
        expire: 0,
      });
    });

    it('should not include cacheLife when cacheProfile is not provided', () => {
      const config = createNextConfig({ cacheProfile: undefined });
      
      expect(config.cacheLife).toBeUndefined();
    });
  });

  describe('Predefined configurations', () => {
    it('should have defaultConfig with homepage cache profile', () => {
      expect(defaultConfig.cacheLife).toEqual({
        stale: 60,
        revalidate: 900,
        expire: 86400,
      });
    });

    it('should have apiConfig with api cache profile', () => {
      expect(apiConfig.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
    });

    it('should have userFacingConfig with user cache profile', () => {
      expect(userFacingConfig.cacheLife).toEqual({
        stale: 300,
        revalidate: 3600,
        expire: 7200,
      });
    });

    it('should have marketingConfig with homepage cache profile', () => {
      expect(marketingConfig.cacheLife).toEqual({
        stale: 60,
        revalidate: 900,
        expire: 86400,
      });
    });
  });

  describe('Cache profile values validation', () => {
    it('should have appropriate cache durations for different profiles', () => {
      const profiles = {
        homepage: { stale: 60, revalidate: 900, expire: 86400 },
        api: { stale: 5, revalidate: 60, expire: 300 },
        user: { stale: 300, revalidate: 3600, expire: 7200 },
        content: { stale: 3600, revalidate: 86400, expire: 172800 },
        analytics: { stale: 900, revalidate: 1800, expire: 3600 },
        images: { stale: 86400, revalidate: 604800, expire: 2592000 },
        short: { stale: 30, revalidate: 60, expire: 300 },
        nocache: { stale: 0, revalidate: 0, expire: 0 },
      };

      // Test each profile
      Object.entries(profiles).forEach(([profileName, expectedValues]) => {
        const config = createNextConfig({ cacheProfile: profileName as any });
        expect(config.cacheLife).toEqual(expectedValues);
      });
    });

    it('should have hierarchical cache durations (stale < revalidate < expire)', () => {
      const config = createNextConfig({ cacheProfile: 'content' });
      const cacheLife = config.cacheLife!;

      expect(cacheLife.stale).toBeLessThan(cacheLife.revalidate);
      expect(cacheLife.revalidate).toBeLessThan(cacheLife.expire);
    });

    it('should have zero values for nocache profile', () => {
      const config = createNextConfig({ cacheProfile: 'nocache' });
      const cacheLife = config.cacheLife!;

      expect(cacheLife.stale).toBe(0);
      expect(cacheLife.revalidate).toBe(0);
      expect(cacheLife.expire).toBe(0);
    });

    it('should have longest cache duration for images', () => {
      const imagesConfig = createNextConfig({ cacheProfile: 'images' });
      const apiConfig = createNextConfig({ cacheProfile: 'api' });

      expect(imagesConfig.cacheLife!.expire).toBeGreaterThan(apiConfig.cacheLife!.expire);
      expect(imagesConfig.cacheLife!.revalidate).toBeGreaterThan(apiConfig.cacheLife!.revalidate);
      expect(imagesConfig.cacheLife!.stale).toBeGreaterThan(apiConfig.cacheLife!.stale);
    });
  });

  describe('Cache profile integration with other options', () => {
    it('should combine cache profile with other configuration options', () => {
      const config = createNextConfig({
        cacheProfile: 'api',
        enableCSP: false,
        enableHSTS: true,
        imageDomains: ['example.com'],
      });

      expect(config.cacheLife).toEqual({
        stale: 5,
        revalidate: 60,
        expire: 300,
      });
      expect(config.experimental).toBeDefined();
      expect(config.images?.domains).toContain('example.com');
    });

    it('should work with Turbopack enabled', () => {
      const config = createNextConfig({
        cacheProfile: 'user',
        enableTurbopack: true,
      });

      expect(config.cacheLife).toEqual({
        stale: 300,
        revalidate: 3600,
        expire: 7200,
      });
      expect(config.turbopack).toBeDefined();
    });

    it('should work with environment overrides', () => {
      const envOverrides = {
        development: {
          cacheLife: {
            stale: 1,
            revalidate: 10,
            expire: 100,
          },
        },
      };

      // Mock development environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const config = createNextConfig({
        cacheProfile: 'api',
        envOverrides,
      });

      // Should be overridden by environment-specific config
      expect(config.cacheLife).toEqual({
        stale: 1,
        revalidate: 10,
        expire: 100,
      });

      // Restore original environment
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Cache profile type safety', () => {
    it('should accept valid cache profile types', () => {
      const validProfiles = [
        'homepage',
        'api', 
        'user',
        'content',
        'analytics',
        'images',
        'short',
        'nocache',
      ] as const;

      validProfiles.forEach(profile => {
        expect(() => {
          const config = createNextConfig({ cacheProfile: profile });
          expect(config.cacheLife).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should handle cacheProfile as undefined', () => {
      expect(() => {
        const config = createNextConfig({ cacheProfile: undefined });
        expect(config.cacheLife).toBeUndefined();
      }).not.toThrow();
    });
  });
});

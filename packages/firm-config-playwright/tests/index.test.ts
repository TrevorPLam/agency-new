import { describe, expect, it } from 'vitest';
import { createPlaywrightConfig } from '../src/index';

describe('createPlaywrightConfig', () => {
  it('creates a playwright config with default browsers', () => {
    const config = createPlaywrightConfig();

    expect(config.projects).toBeDefined();
    expect(config.projects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'chromium' }),
        expect.objectContaining({ name: 'firefox' }),
        expect.objectContaining({ name: 'webkit' }),
      ])
    );
  });
});

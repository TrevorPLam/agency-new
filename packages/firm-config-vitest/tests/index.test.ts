import { describe, expect, it } from 'vitest';
import { createVitestConfig } from '../src/index';

describe('createVitestConfig', () => {
  it('returns a default Vitest config with coverage thresholds', () => {
    const config = createVitestConfig();

    expect(config.test).toBeDefined();
    expect(config.test?.coverage).toMatchObject({
      provider: 'v8',
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    });
  });
});

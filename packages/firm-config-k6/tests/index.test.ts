import { describe, expect, it } from 'vitest';
import { createK6Config } from '../src/index';

describe('createK6Config', () => {
  it('returns a load test config with a base URL', () => {
    const config = createK6Config({ baseURL: 'http://example.com' });

    expect(config.env.BASE_URL).toBe('http://example.com');
    expect(config.scenarios.default.executor).toBe('ramping-vus');
  });
});

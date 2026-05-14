import { describe, expect, it } from 'vitest';
import { createSecurityHeaders } from '../src/index';

describe('createSecurityHeaders', () => {
  it('creates a default security headers payload without unsafe-eval', () => {
    const result = createSecurityHeaders();

    expect(result.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'Strict-Transport-Security' }),
        expect.objectContaining({ key: 'Content-Security-Policy' }),
      ])
    );

    const csp = result.headers.find((header) => header.key === 'Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp?.value).not.toContain('unsafe-eval');
  });
});

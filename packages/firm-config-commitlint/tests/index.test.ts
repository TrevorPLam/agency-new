import { describe, expect, it } from 'vitest';
import { createCommitlintConfig } from '../src/index';

describe('createCommitlintConfig', () => {
  it('returns a commitlint config with conventional rules', () => {
    const config = createCommitlintConfig();

    expect(config.extends).toContain('@commitlint/config-conventional');
    expect(config.rules['type-enum']).toEqual([2, 'always', expect.any(Array)]);
    expect(config.rules['scope-empty']).toEqual([2, 'never']);
  });
});

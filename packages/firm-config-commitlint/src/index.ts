export interface CommitlintConfig {
  extends: string[];
  rules: Record<string, [number, string, string[]] | null>;
}

export function createCommitlintConfig(): CommitlintConfig {
  return {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore']],
      'scope-empty': [2, 'never'],
      'subject-case': [2, 'always', ['sentence-case', 'lower-case']],
      'body-max-line-length': [1, 'always', 100],
    },
  };
}

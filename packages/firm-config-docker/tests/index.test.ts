import { describe, expect, it } from 'vitest';
import { createDockerfile } from '../src/index';

describe('createDockerfile', () => {
  it('builds a hardened multi-stage Dockerfile', () => {
    const dockerfile = createDockerfile({ port: 8080, nonRootUid: 10000 });

    expect(dockerfile).toContain('FROM node:20-alpine AS builder');
    expect(dockerfile).toContain('EXPOSE 8080');
    expect(dockerfile).toContain('USER 10000');
    expect(dockerfile).toContain('HEALTHCHECK');
  });
});

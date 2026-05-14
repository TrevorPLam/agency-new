export interface DockerfileOptions {
  nodeVersion?: string;
  workdir?: string;
  port?: number;
  nonRootUid?: number;
  maintainer?: string;
}

export function createDockerfile(options: DockerfileOptions = {}): string {
  const {
    nodeVersion = '20-alpine',
    workdir = '/usr/src/app',
    port = 3000,
    nonRootUid = 10000,
    maintainer = 'firm-platform@localhost',
  } = options;

  return `# syntax=docker/dockerfile:1\n`
    + `FROM node:${nodeVersion} AS builder\n`
    + `WORKDIR ${workdir}\n`
    + `COPY package.json pnpm-lock.yaml ./\n`
    + `COPY packages ./packages\n`
    + `RUN corepack enable && corepack pnpm install --frozen-lockfile\n`
    + `RUN corepack pnpm build\n\n`
    + `FROM node:${nodeVersion} AS runner\n`
    + `LABEL maintainer="${maintainer}"\n`
    + `WORKDIR ${workdir}\n`
    + `COPY --from=builder ${workdir} .\n`
    + `RUN corepack pnpm prune --prod\n`
    + `EXPOSE ${port}\n`
    + `ENV NODE_ENV=production\n`
    + `USER ${nonRootUid}\n`
    + `ENTRYPOINT ["node", "./packages/app.js"]\n`
    + `HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\n        CMD wget --quiet --tries=1 --spider http://localhost:${port}/health || exit 1\n`;
}

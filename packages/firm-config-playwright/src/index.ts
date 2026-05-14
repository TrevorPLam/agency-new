export interface PlaywrightConfigOptions {
  baseURL?: string;
  browserNames?: string[];
  authStatePath?: string;
  outputDir?: string;
  useTrace?: boolean;
}

export function createPlaywrightConfig(options: PlaywrightConfigOptions = {}) {
  const {
    baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    browserNames = ['chromium', 'firefox', 'webkit'],
    authStatePath,
    outputDir = 'test-results/playwright',
    useTrace = false,
  } = options;

  return {
    testDir: 'tests',
    timeout: 30_000,
    expect: {
      timeout: 5_000,
    },
    use: {
      baseURL,
      actionTimeout: 10_000,
      trace: useTrace ? 'on-first-retry' : 'off',
      viewport: { width: 1280, height: 720 },
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      storageState: authStatePath,
    },
    projects: browserNames.map((name) => ({
      name,
      use: { browserName: name },
    })),
    outputDir,
  };
}

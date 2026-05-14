export interface K6ConfigOptions {
  baseURL?: string;
  vus?: number;
  duration?: string;
  rampUp?: string;
  env?: Record<string, string>;
}

export function createK6Config(options: K6ConfigOptions = {}) {
  const {
    baseURL = process.env.K6_BASE_URL ?? 'http://localhost:3000',
    vus = 10,
    duration = '1m',
    rampUp = '30s',
    env = {},
  } = options;

  return {
    ext: {
      loadimpact: {
        projectID: 123456,
        name: 'firm-k6-load-test',
      },
    },
    scenarios: {
      default: {
        executor: 'ramping-vus',
        startVUs: 1,
        stages: [
          { duration: rampUp, target: vus },
          { duration, target: vus },
          { duration: rampUp, target: 0 },
        ],
        gracefulStop: '30s',
      },
    },
    env: {
      BASE_URL: baseURL,
      ...env,
    },
  };
}

import { type AwsSdkMatchers, awsSdkMatchers } from './awsSdk.js';
import { type LoggerMatchers, loggerMatchers } from './logger.js';
import { type MetricsMatchers, metricsMatchers } from './metrics.js';

/**
 * Custom matchers registered by `setupEnv.ts` through `expect.extend`.
 */
const matchers = {
  ...awsSdkMatchers,
  ...loggerMatchers,
  ...metricsMatchers,
};

declare module 'vitest' {
  interface Assertion<R, T>
    extends AwsSdkMatchers,
      LoggerMatchers,
      MetricsMatchers {}
  interface AsymmetricMatchersContaining extends AwsSdkMatchers {}
}

export { matchers };

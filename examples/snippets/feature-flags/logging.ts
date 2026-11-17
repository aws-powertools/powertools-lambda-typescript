import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'checkout', logLevel: 'DEBUG' });
const flags = new FeatureFlags({
  logger, // One call-level outcome and, on fallback, one warning.
  store: ruleEngineStore({
    source: async () => ({ checkout_v2: { default: true } }),
    // Pass logger here too if you need per-flag rule selection logs.
  }),
});

export const handler = async () =>
  flags.evaluateMany({ flags: { checkout_v2: false, banner: 'none' } });

import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';
import document from './flagDocument.json' with { type: 'json' };

const flags = new FeatureFlags({
  store: ruleEngineStore({ source: async () => document }),
});

export const handler = async () =>
  flags.getEnabledFeatures({ context: { tier: 'premium' } });
// ['checkout_v2', 'ten_percent_off_campaign']

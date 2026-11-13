import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';
import document from './moduloDocument.json' with { type: 'json' };

const flags = new FeatureFlags({
  store: ruleEngineStore({ source: async () => document }),
});

export const handler = async () =>
  flags.evaluate({
    name: 'checkout_v2',
    context: { customer_id: 12345 },
    default: false,
  });

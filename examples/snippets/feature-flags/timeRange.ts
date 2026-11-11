import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';
import document from './scheduleDocument.json' with { type: 'json' };

const flags = new FeatureFlags({
  store: ruleEngineStore({ source: async () => document }),
});

export const handler = async () =>
  flags.evaluate({ name: 'happy_hour', default: false });

import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';

const flags = new FeatureFlags({
  store: ruleEngineStore({
    source: async () => ({
      checkout_v2: { default: true },
      limit: { default: 20, boolean_type: false },
    }),
  }),
});

export const handler = async () => {
  const result = await flags.evaluateMany({
    flags: { checkout_v2: false, limit: 10, banner: 'none' },
    context: { tier: 'premium' },
  });
  // { checkout_v2: true, limit: 20, banner: 'none' }
  return result;
};

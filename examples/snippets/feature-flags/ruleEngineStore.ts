import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';

const document = {
  checkout_v2: {
    default: false,
    rules: {
      premium_customers: {
        when_match: true,
        conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
      },
    },
  },
};

const flags = new FeatureFlags({
  store: ruleEngineStore({ source: async () => document }),
});
const checkoutV2 = await flags.evaluate({
  name: 'checkout_v2',
  context: { tier: 'premium' },
  default: false,
});
console.log(checkoutV2);

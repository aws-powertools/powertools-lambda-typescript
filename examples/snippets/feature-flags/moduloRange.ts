import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';

const document = {
  checkout_v2: {
    default: false,
    rules: {
      first_twenty_percent: {
        when_match: true,
        conditions: [
          {
            action: 'MODULO_RANGE',
            key: 'customer_id',
            value: { BASE: 100, START: 0, END: 19 },
          },
        ],
      },
    },
  },
};

const flags = new FeatureFlags({
  store: ruleEngineStore({ source: async () => document }),
});
const checkoutV2 = await flags.evaluate({
  name: 'checkout_v2',
  context: { customer_id: 12345 },
  default: false,
});
console.log(checkoutV2);

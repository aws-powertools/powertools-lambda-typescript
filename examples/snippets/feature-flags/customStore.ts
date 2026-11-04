import {
  FeatureFlags,
  type Store,
  type StoreResult,
} from '@aws-lambda-powertools/feature-flags';

const store: Store = {
  name: 'in-memory',
  getMany: async (names, _context) => {
    const result: Record<string, StoreResult> = {};
    for (const name of names) {
      result[name] =
        name === 'checkout_v2'
          ? { found: true, value: true, enabled: true }
          : { found: false };
    }
    return result;
  },
  getAll: async (_context) => ({
    checkout_v2: { found: true, value: true, enabled: true },
  }),
};

const flags = new FeatureFlags({ store });
const checkoutV2 = await flags.evaluate({
  name: 'checkout_v2',
  default: false,
});
console.log(checkoutV2);

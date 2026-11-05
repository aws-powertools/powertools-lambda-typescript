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
const result = await flags.evaluateMany({
  flags: { checkout_v2: false, limit: 10, banner: 'none' },
  context: { tier: 'premium' },
});
console.log(result);

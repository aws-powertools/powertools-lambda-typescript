import {
  FeatureFlags,
  type Store,
  type StoreResult,
} from '@aws-lambda-powertools/feature-flags';

export const store: Store = {
  name: 'in-memory',
  getMany: async (names, _context) => {
    const results: [string, StoreResult][] = [];
    for (const name of names) {
      results.push([
        name,
        name === 'checkout_v2'
          ? { found: true, value: true, enabled: true }
          : { found: false },
      ]);
    }
    return Object.fromEntries(results);
  },
  getAll: async (_context) => ({
    checkout_v2: { found: true, value: true, enabled: true },
  }),
};

const flags = new FeatureFlags({ store });

export const handler = async () =>
  flags.evaluate({ name: 'checkout_v2', default: false });

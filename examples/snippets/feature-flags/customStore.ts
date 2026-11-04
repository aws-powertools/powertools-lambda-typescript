import { FeatureFlags, type Store } from '@aws-lambda-powertools/feature-flags';

const store: Store = {
  name: 'in-memory',
  getMany: async (names, _context) =>
    Object.fromEntries(
      names.map((name) => [
        name,
        name === 'checkout_v2'
          ? { found: true, value: true, enabled: true }
          : { found: false },
      ])
    ),
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

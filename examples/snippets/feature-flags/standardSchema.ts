import { FeatureFlags, type Store } from '@aws-lambda-powertools/feature-flags';
import { z } from 'zod';

const store: Store = {
  name: 'settings',
  getMany: async () => ({
    settings: {
      found: true,
      value: { theme: 'dark', limit: 10 },
      enabled: true,
    },
  }),
  getAll: async () => ({}),
};

const flags = new FeatureFlags({ store });
const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']),
  limit: z.number(),
});

const settings = await flags.evaluate({
  name: 'settings',
  default: { theme: 'light', limit: 5 },
  schema: settingsSchema,
});

// TypeScript infers settings as { theme: 'light' | 'dark'; limit: number }.

export { settings };

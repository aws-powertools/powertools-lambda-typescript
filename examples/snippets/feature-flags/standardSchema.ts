import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';
import { z } from 'zod';

const flags = new FeatureFlags({
  store: ruleEngineStore({
    source: async () => ({
      settings: { default: { theme: 'dark', limit: 10 }, boolean_type: false },
      launch_date: { default: '2026-12-01T00:00:00Z', boolean_type: false },
    }),
  }),
});
const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']),
  limit: z.number(),
});
const dateSchema = z.iso.datetime().transform((value) => new Date(value));

export const handler = async () => {
  const settings = await flags.evaluate({
    name: 'settings',
    default: { theme: 'light', limit: 5 },
    schema: settingsSchema,
  });
  // settings is { theme: 'light' | 'dark'; limit: number }.
  const result = await flags.evaluateMany({
    flags: {
      settings: { theme: 'light', limit: 5 },
      launch_date: '2026-01-01T00:00:00Z',
    },
    schemas: { settings: settingsSchema, launch_date: dateSchema },
  });
  // result.launch_date is a Date, including when the fallback is used.
  return { settings, result };
};

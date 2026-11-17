import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';
import { describe, expect, it } from 'vitest';
import document from './scheduleDocument.json' with { type: 'json' };

describe('Happy hour', () => {
  it('includes the end minute in the configured timezone', async () => {
    // Prepare
    const flags = new FeatureFlags({
      store: ruleEngineStore({
        source: async () => document,
        now: () => new Date('2026-06-01T17:00:59Z'), // 19:00 in Rome.
      }),
    });

    // Act
    const result = await flags.evaluate({ name: 'happy_hour', default: false });

    // Assess
    expect(result).toBe(true);
  });
});

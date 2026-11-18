import {
  FeatureFlags,
  ruleEngineStore,
} from '@aws-lambda-powertools/feature-flags';
import { describe, expect, it } from 'vitest';

describe('Checkout rules', () => {
  it.each([
    { tier: 'premium', expected: true },
    { tier: 'standard', expected: false },
  ])('evaluates the rule for $tier', async ({ tier, expected }) => {
    // Prepare
    const flags = new FeatureFlags({
      store: ruleEngineStore({
        source: async () => ({
          checkout_v2: {
            default: false,
            rules: {
              premium_customers: {
                when_match: true,
                conditions: [
                  { action: 'EQUALS', key: 'tier', value: 'premium' },
                ],
              },
            },
          },
        }),
      }),
    });

    // Act
    const result = await flags.evaluate({
      name: 'checkout_v2',
      context: { tier },
      default: false,
    });

    // Assess
    expect(result).toBe(expected);
  });
});

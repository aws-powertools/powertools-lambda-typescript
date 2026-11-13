import { FeatureFlags } from '@aws-lambda-powertools/feature-flags';
import { describe, expect, it } from 'vitest';
import { store } from './customStore.js';

describe('Checkout', () => {
  it('returns an in-memory flag and a missing flag fallback', async () => {
    // Prepare
    const flags = new FeatureFlags({ store });

    // Act
    const result = await flags.evaluateMany({
      flags: { checkout_v2: false, banner: 'none' },
    });

    // Assess
    expect(result).toEqual({ checkout_v2: true, banner: 'none' });
  });
});

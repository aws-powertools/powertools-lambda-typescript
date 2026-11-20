import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import profile from './variantProfile.json' with { type: 'json' };

describe('AppConfig Variants', () => {
  beforeEach(() => {
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    vi.stubEnv(
      'POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE',
      JSON.stringify(profile)
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes a whole local profile without calling the Agent', async () => {
    // Prepare
    const { handler } = await import('./variantStore.js');

    // Act
    const result = await handler();

    // Assess
    expect(result.attributes).toEqual({ theme: 'dark' });
    expect(result.variants.checkout).toEqual({
      enabled: false,
      variant: 'default',
      attributes: {},
    });
    expect(result.enabledFeatures).toEqual(['ui_refresh']);
  });
});

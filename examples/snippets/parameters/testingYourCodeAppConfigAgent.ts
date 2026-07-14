import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Function tests', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv(
      'POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE',
      JSON.stringify({ featureX: true })
    );
  });

  it('returns the expected response', async () => {
    // Prepare
    const { handler } = await import(
      './testingYourCodeAppConfigAgentHandler.js'
    );

    // Act
    const response = await handler({}, {});

    // Assess
    expect(response).toEqual({ featureX: true });
  });
});

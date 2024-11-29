import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.POWERTOOLS_DEV = 'true';
  process.env.POWERTOOLS_METRICS_ENABLED = 'true';
});

describe('Metrics tests', () => {
  it('emits metrics properly', async () => {
    // Prepare
    const metricsEmittedSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => {});

    // Act
    // ...

    // Assess
    expect(metricsEmittedSpy).toHaveBeenCalledOnce();
  });
});

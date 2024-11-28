import { describe, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.POWERTOOLS_DEV = 'true';
});

describe('Metrics tests', () => {
  it('emits metrics properly', async () => {
    // Prepare
    const metricsSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Act & Assess
    // ...
  });
});

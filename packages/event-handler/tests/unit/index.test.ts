import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { foo } from '../../src/index.js';

describe('Event Handler', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  it('should return true', () => {
    // Act
    const result = foo();

    // Assess
    expect(result).toBe(true);
  });
});

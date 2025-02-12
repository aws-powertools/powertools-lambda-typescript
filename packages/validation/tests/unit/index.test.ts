import { beforeEach, describe, expect, it, vi } from 'vitest';
import { foo } from '../../src/index.js';

describe('Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true', () => {
    // Act
    const result = foo();

    // Assess
    expect(result).toBe(true);
  });
});

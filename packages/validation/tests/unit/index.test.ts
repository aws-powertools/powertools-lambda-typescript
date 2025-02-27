import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchemaValidationError, validate } from '../../src/index.js';

describe('Index exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export validate as a function', () => {
    // Act & Assess
    expect(typeof validate).toBe('function');
  });

  it('should export SchemaValidationError as a function', () => {
    // Act & Assess
    expect(typeof SchemaValidationError).toBe('function');
  });
});

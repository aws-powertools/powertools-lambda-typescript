import { describe, expect, it } from 'vitest';
import { foo } from '../../src/index.js';

describe('foo function', () => {
  it('should return true', () => {
    expect(foo()).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromBase64 } from '../../src/fromBase64.js';

describe('Function: fromBase64', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns the Uint8Array from a base64 string', () => {
    // Prepare
    const base64 = 'aGVsbG8gd29ybGQ=';
    const expected = new Uint8Array([
      97, 71, 86, 115, 98, 71, 56, 103, 100, 50, 57, 121, 98, 71, 81, 61,
    ]);

    // Act
    const result = fromBase64(base64);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it('throws a TypeError when the base64 string has incorrect padding', () => {
    // Prepare
    const base64 = 'aGVsbG8gd29ybGQ';

    // Act
    const result = (): Uint8Array => fromBase64(base64);

    // Assess
    expect(result).toThrow(TypeError);
    expect(result).toThrow('Incorrect padding on base64 string.');
  });

  it('throws a TypeError when the base64 string is invalid', () => {
    // Prepare
    const base64 = 'a-VsbG8gd29ybGQ=';

    // Act
    const result = (): Uint8Array => fromBase64(base64);

    // Assess
    expect(result).toThrow(TypeError);
    expect(result).toThrow('Invalid base64 string.');
  });

  it('uses the provided encoding to create the Uint8Array', () => {
    // Prepare
    const base64 = 'aGVsbG8gd29ybGQ=';
    const encoding = 'utf8';
    const expected = new Uint8Array([
      97, 71, 86, 115, 98, 71, 56, 103, 100, 50, 57, 121, 98, 71, 81, 61,
    ]);

    // Act
    const result = fromBase64(base64, encoding);

    // Assess
    expect(result).toStrictEqual(expected);
  });
});

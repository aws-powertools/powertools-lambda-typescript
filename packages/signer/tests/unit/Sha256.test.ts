import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Sha256 } from '../../src/Sha256.js';

describe('Class: Sha256', () => {
  it('computes a plain SHA-256 digest matching node:crypto', async () => {
    // Prepare
    const hash = new Sha256();
    hash.update('abc');

    // Act
    const digest = await hash.digest();

    // Assess
    const expected = new Uint8Array(
      createHash('sha256').update('abc').digest()
    );
    expect(digest).toEqual(expected);
  });

  it('computes an HMAC-SHA256 digest when given a secret', async () => {
    // Prepare
    const hash = new Sha256('secret');
    hash.update('message');

    // Act
    const digest = await hash.digest();

    // Assess
    const expected = new Uint8Array(
      createHmac('sha256', 'secret').update('message').digest()
    );
    expect(digest).toEqual(expected);
  });

  it('exposes a no-op reset', () => {
    // Prepare
    const hash = new Sha256();

    // Act & Assess
    expect(() => hash.reset()).not.toThrow();
  });
});

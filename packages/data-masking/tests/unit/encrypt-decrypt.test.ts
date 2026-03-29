import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { DataMasking } from '../../src/index.js';
import { DataMaskingEncryptionError } from '../../src/errors.js';
import type { EncryptionProvider } from '../../src/types.js';

const createMockProvider = (): EncryptionProvider => ({
  encrypt: vi.fn(async (data: string) => `ENC:${data}`),
  decrypt: vi.fn(async (data: string) => data.replace('ENC:', '')),
});

describe('DataMasking.encrypt()', () => {
  it('encrypts specified fields in place', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = {
      name: 'Jane',
      customer: { ssn: '123-45-6789', city: 'Anytown' },
    };

    const result = await masker.encrypt(data, {
      fields: ['customer.ssn'],
    });

    expect(result).toEqual({
      name: 'Jane',
      customer: { ssn: 'ENC:"123-45-6789"', city: 'Anytown' },
    });
  });

  it('passes encryption context to provider', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    await masker.encrypt({ secret: 'val' }, {
      fields: ['secret'],
      context: { tenantId: 'acme' },
    });

    expect(provider.encrypt).toHaveBeenCalledWith(
      '"val"',
      { tenantId: 'acme' }
    );
  });

  it('encrypts nested and array fields', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = {
      orders: [
        { id: 1, card: '4111' },
        { id: 2, card: '5500' },
      ],
    };

    const result = await masker.encrypt(data, {
      fields: ['orders[*].card'],
    });

    if (typeof result === 'string') throw new Error('Expected object');
    expect(result.orders[0].card).toBe('ENC:"4111"');
    expect(result.orders[1].card).toBe('ENC:"5500"');
    expect(result.orders[0].id).toBe(1);
  });

  it('throws DataMaskingEncryptionError without provider', async () => {
    const masker = new DataMasking();

    await expect(
      masker.encrypt({ a: 1 }, { fields: ['a'] })
    ).rejects.toThrow(DataMaskingEncryptionError);
  });

  it('does not mutate original input', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { secret: 'original' };

    await masker.encrypt(data, { fields: ['secret'] });

    expect(data.secret).toBe('original');
  });
});

describe('DataMasking.encrypt() - full payload', () => {
  it('encrypts entire payload when no fields specified', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { name: 'Jane', ssn: '123-45-6789' };

    const result = await masker.encrypt(data);

    expect(typeof result).toBe('string');
    expect(result).toBe(`ENC:${JSON.stringify(data)}`);
  });

  it('passes encryption context for full payload', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    await masker.encrypt({ a: 1 }, { context: { env: 'prod' } });

    expect(provider.encrypt).toHaveBeenCalledWith(
      '{"a":1}',
      { env: 'prod' }
    );
  });
});

describe('DataMasking.decrypt() - full payload', () => {
  it('decrypts opaque string and restores original data', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const original = { name: 'Jane', age: 30 };
    const encrypted = `ENC:${JSON.stringify(original)}`;

    const result = await masker.decrypt(encrypted);

    expect(result).toEqual(original);
  });
});

describe('DataMasking.decrypt() - field level', () => {
  it('decrypts specified fields and restores original values', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const encrypted = {
      name: 'Jane',
      customer: { ssn: 'ENC:"123-45-6789"', city: 'Anytown' },
    };

    const result = await masker.decrypt(encrypted, {
      fields: ['customer.ssn'],
    });

    expect(result).toEqual({
      name: 'Jane',
      customer: { ssn: '123-45-6789', city: 'Anytown' },
    });
  });

  it('throws DataMaskingEncryptionError without provider', async () => {
    const masker = new DataMasking();

    await expect(
      masker.decrypt({ a: 'encrypted' }, { fields: ['a'] })
    ).rejects.toThrow(DataMaskingEncryptionError);
  });
});

const jmesPathKey = fc.stringMatching(/^[a-z][a-z0-9_]{0,10}$/);

describe('DataMasking encrypt/decrypt - property tests', () => {
  it('full-payload encrypt then decrypt is identity', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    await fc.assert(
      fc.asyncProperty(fc.jsonValue(), async (data) => {
        if (data === null || data === undefined) return;
        const encrypted = await masker.encrypt(data);
        const result = await masker.decrypt(encrypted);

        // Compare via JSON since encrypt/decrypt round-trips through JSON.stringify/parse
        expect(JSON.stringify(result)).toBe(JSON.stringify(data));
      })
    );
  });

  it('field-level encrypt then decrypt restores original values', async () => {
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    await fc.assert(
      fc.asyncProperty(
        fc.dictionary(jmesPathKey, fc.string(), { minKeys: 1 }),
        async (data) => {
          const fields = Object.keys(data);
          const encrypted = await masker.encrypt(data, { fields });
          const decrypted = await masker.decrypt(encrypted, { fields });

          expect(decrypted).toEqual(data);
        }
      )
    );
  });
});

import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DataMaskingEncryptionError,
  DataMaskingFieldNotFoundError,
} from '../../src/errors.js';
import { DataMasking } from '../../src/index.js';
import type { EncryptionProvider } from '../../src/types.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const createMockProvider = (): EncryptionProvider => ({
  encrypt: vi.fn(async (data: string) => `ENC:${data}`),
  decrypt: vi.fn(async (data: string) => data.replace('ENC:', '')),
});

describe('DataMasking.encrypt()', () => {
  it('encrypts specified fields in place', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = {
      name: 'Jane',
      customer: { ssn: '123-45-6789', city: 'Anytown' },
    };

    // Act
    const result = await masker.encrypt(data, {
      fields: ['customer.ssn'],
    });

    // Assess
    expect(result).toEqual({
      name: 'Jane',
      customer: { ssn: 'ENC:"123-45-6789"', city: 'Anytown' },
    });
  });

  it('passes encryption context to provider', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    // Act
    await masker.encrypt(
      { secret: 'val' },
      {
        fields: ['secret'],
        context: { tenantId: 'acme' },
      }
    );

    // Assess
    expect(provider.encrypt).toHaveBeenCalledWith('"val"', {
      tenantId: 'acme',
    });
  });

  it('encrypts nested and array fields', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = {
      orders: [
        { id: 1, card: '4111' },
        { id: 2, card: '5500' },
      ],
    };

    // Act
    const result = await masker.encrypt(data, {
      fields: ['orders[*].card'],
    });

    if (typeof result === 'string') throw new Error('Expected object');

    // Assess
    expect(result.orders[0].card).toBe('ENC:"4111"');
    expect(result.orders[1].card).toBe('ENC:"5500"');
    expect(result.orders[0].id).toBe(1);
  });

  it('prevents prototype pollution when __proto__ is used as a field path', async () => {
    // Prepare
    const provider = createMockProvider();
    const lenientMasker = new DataMasking({
      provider,
      throwOnMissingField: false,
    });
    const data = { safe: 'value' };

    // Act
    const result = await lenientMasker.encrypt(data, {
      fields: ['__proto__', 'safe'],
    });

    if (typeof result === 'string') throw new Error('Expected object');

    // Assess
    expect(result.safe).toBe('ENC:"value"');
    expect(Object.getPrototypeOf(result)).toEqual(Object.getPrototypeOf({}));
  });

  it('throws DataMaskingEncryptionError without provider', async () => {
    // Prepare
    const masker = new DataMasking();

    // Act & Assess
    await expect(masker.encrypt({ a: 1 }, { fields: ['a'] })).rejects.toThrow(
      DataMaskingEncryptionError
    );
  });

  it('throws DataMaskingFieldNotFoundError for missing field when throwOnMissingField is true', async () => {
    // Prepare
    const masker = new DataMasking({ provider: createMockProvider() });
    const data = { ssn: '123' };

    // Act & Assess
    await expect(masker.encrypt(data, { fields: ['snn'] })).rejects.toThrow(
      DataMaskingFieldNotFoundError
    );
  });

  it('resolves every field before calling the provider', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { ssn: '123' };

    // Act & Assess
    await expect(
      masker.encrypt(data, { fields: ['ssn', 'snn'] })
    ).rejects.toThrow(DataMaskingFieldNotFoundError);
    expect(provider.encrypt).not.toHaveBeenCalled();
  });

  it('does not report a wildcard over an empty collection as a missing field', async () => {
    // Prepare
    const masker = new DataMasking({ provider: createMockProvider() });
    const data = { orders: [] };

    // Act
    const result = await masker.encrypt(data, { fields: ['orders[*].card'] });

    // Assess
    expect(result).toEqual({ orders: [] });
  });

  it('leaves a present but undefined value untouched and round-trips it', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { ssn: undefined, name: 'Jane' };

    // Act
    const encrypted = await masker.encrypt(data, { fields: ['ssn', 'name'] });
    const decrypted = await masker.decrypt(encrypted, {
      fields: ['ssn', 'name'],
    });

    // Assess
    expect(encrypted).toEqual({ ssn: undefined, name: 'ENC:"Jane"' });
    expect(decrypted).toEqual({ ssn: undefined, name: 'Jane' });
    expect(provider.encrypt).toHaveBeenCalledTimes(1);
    expect(provider.decrypt).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('encrypts only the parent when both a parent and its child are listed', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { a: { b: 'x' } };

    // Act
    const result = await masker.encrypt(data, { fields: ['a', 'a.b'] });

    // Assess
    expect(result).toEqual({ a: 'ENC:{"b":"x"}' });
    expect(provider.encrypt).toHaveBeenCalledTimes(1);
  });

  it('skips missing field with a warning when throwOnMissingField is false', async () => {
    // Prepare
    const lenientMasker = new DataMasking({
      provider: createMockProvider(),
      throwOnMissingField: false,
    });
    const data = { ssn: '123' };

    // Act
    const result = await lenientMasker.encrypt(data, {
      fields: ['snn', 'ssn'],
    });

    // Assess
    expect(result).toEqual({ ssn: 'ENC:"123"' });
    expect(console.warn).toHaveBeenCalledWith("Field not found: 'snn'");
  });

  it('does not mutate original input', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { secret: 'original' };

    // Act
    await masker.encrypt(data, { fields: ['secret'] });

    // Assess
    expect(data.secret).toBe('original');
  });
});

describe('DataMasking.encrypt() - full payload', () => {
  it('encrypts entire payload when no fields specified', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { name: 'Jane', ssn: '123-45-6789' };

    // Act
    const result = await masker.encrypt(data);

    // Assess
    expect(typeof result).toBe('string');
    expect(result).toBe(`ENC:${JSON.stringify(data)}`);
  });

  it('passes encryption context for full payload', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    // Act
    await masker.encrypt({ a: 1 }, { context: { env: 'prod' } });

    // Assess
    expect(provider.encrypt).toHaveBeenCalledWith('{"a":1}', { env: 'prod' });
  });
});

describe('DataMasking.decrypt() - full payload', () => {
  it('decrypts opaque string and restores original data', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const original = { name: 'Jane', age: 30 };
    const encrypted = `ENC:${JSON.stringify(original)}`;

    // Act
    const result = await masker.decrypt(encrypted);

    // Assess
    expect(result).toEqual(original);
  });
});

describe('DataMasking.decrypt() - field level', () => {
  it('decrypts specified fields and restores original values', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const encrypted = {
      name: 'Jane',
      customer: { ssn: 'ENC:"123-45-6789"', city: 'Anytown' },
    };

    // Act
    const result = await masker.decrypt(encrypted, {
      fields: ['customer.ssn'],
    });

    // Assess
    expect(result).toEqual({
      name: 'Jane',
      customer: { ssn: '123-45-6789', city: 'Anytown' },
    });
  });

  it('throws DataMaskingFieldNotFoundError for missing field when throwOnMissingField is true', async () => {
    // Prepare
    const masker = new DataMasking({ provider: createMockProvider() });
    const encrypted = { ssn: 'ENC:"123"' };

    // Act & Assess
    await expect(
      masker.decrypt(encrypted, { fields: ['snn'] })
    ).rejects.toThrow(DataMaskingFieldNotFoundError);
  });

  it('returns a copy when decrypting object without fields', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { name: 'Jane', age: 30 };

    // Act
    const result = await masker.decrypt(data);

    // Assess
    expect(result).toEqual(data);
    expect(provider.decrypt).not.toHaveBeenCalled();
  });

  it('passes through non-string values during field-level decrypt and warns', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });
    const data = { num: 42, text: 'ENC:"hello"' };

    // Act
    const result = await masker.decrypt(data, { fields: ['num', 'text'] });

    // Assess
    expect(result).toEqual({ num: 42, text: 'hello' });
    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('non-string value of type number')
    );
  });

  it('rejects the whole operation and leaves the original untouched when one field fails to decrypt', async () => {
    // Prepare
    const provider: EncryptionProvider = {
      encrypt: vi.fn(async (data: string) => `ENC:${data}`),
      decrypt: vi.fn(async (data: string) => {
        if (data === 'BAD') throw new Error('decryption failed');

        return data.replace('ENC:', '');
      }),
    };
    const masker = new DataMasking({ provider });
    const data = { good: 'ENC:"ok"', bad: 'BAD' };

    // Act & Assess
    await expect(
      masker.decrypt(data, { fields: ['good', 'bad'] })
    ).rejects.toThrow('decryption failed');
    expect(data).toEqual({ good: 'ENC:"ok"', bad: 'BAD' });
  });

  it('rejects the whole operation and leaves the original untouched when one field fails to encrypt', async () => {
    // Prepare
    const provider: EncryptionProvider = {
      encrypt: vi.fn(async (data: string) => {
        if (data.includes('boom')) throw new Error('encryption failed');

        return `ENC:${data}`;
      }),
      decrypt: vi.fn(async (data: string) => data),
    };
    const masker = new DataMasking({ provider });
    const data = { a: 'fine', b: 'boom' };

    // Act & Assess
    await expect(masker.encrypt(data, { fields: ['a', 'b'] })).rejects.toThrow(
      'encryption failed'
    );
    expect(data).toEqual({ a: 'fine', b: 'boom' });
  });

  it('throws DataMaskingEncryptionError without provider', async () => {
    // Prepare
    const masker = new DataMasking();

    // Act & Assess
    await expect(
      masker.decrypt({ a: 'encrypted' }, { fields: ['a'] })
    ).rejects.toThrow(DataMaskingEncryptionError);
  });
});

const pathKey = fc.stringMatching(/^[a-z][a-z0-9_]{0,10}$/);

describe('DataMasking encrypt/decrypt - property tests', () => {
  it('full-payload encrypt then decrypt is identity', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    // Act & Assess
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

  it('parent.* encrypt then decrypt restores original values', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    // Act & Assess
    await fc.assert(
      fc.asyncProperty(
        pathKey,
        fc.dictionary(pathKey, fc.string(), { minKeys: 1 }),
        async (parent, nested) => {
          const data = { [parent]: nested };
          const encrypted = await masker.encrypt(data, {
            fields: [`${parent}.*`],
          });
          const decrypted = await masker.decrypt(encrypted, {
            fields: [`${parent}.*`],
          });

          expect(decrypted).toEqual(data);
        }
      )
    );
  });

  it('parent[*].child encrypt then decrypt restores original values', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    // Act & Assess
    await fc.assert(
      fc.asyncProperty(
        pathKey,
        pathKey,
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        async (parent, child, values) => {
          const data = {
            [parent]: values.map((v) => ({ [child]: v })),
          };
          const encrypted = await masker.encrypt(data, {
            fields: [`${parent}[*].${child}`],
          });
          const decrypted = await masker.decrypt(encrypted, {
            fields: [`${parent}[*].${child}`],
          });

          expect(decrypted).toEqual(data);
        }
      )
    );
  });

  it('field-level encrypt then decrypt restores original values', async () => {
    // Prepare
    const provider = createMockProvider();
    const masker = new DataMasking({ provider });

    // Act & Assess
    await fc.assert(
      fc.asyncProperty(
        fc.dictionary(pathKey, fc.string(), { minKeys: 1 }),
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

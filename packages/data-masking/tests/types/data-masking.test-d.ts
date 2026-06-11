import { describe, expectTypeOf, it } from 'vitest';
import { DataMasking } from '../../src/index.js';

describe('DataMasking type tests', () => {
  const masker = new DataMasking();

  it('erase preserves the input type', () => {
    const data = { name: 'Jane', ssn: '123' };
    const result = masker.erase(data, { fields: ['ssn'] });

    expectTypeOf(result).toEqualTypeOf<{ name: string; ssn: string }>();
  });

  it('erase without options returns string[] for arrays', () => {
    const data = [1, 2, 3];
    const result = masker.erase(data);

    expectTypeOf(result).toEqualTypeOf<string[]>();
  });

  it('erase without options returns string for objects', () => {
    const data = { name: 'Jane' };
    const result = masker.erase(data);

    expectTypeOf(result).toEqualTypeOf<string>();
  });

  it('erase returns null for null input', () => {
    const result = masker.erase(null);

    expectTypeOf(result).toEqualTypeOf<null>();
  });

  it('erase rejects fields and maskingRules together', () => {
    const data = { ssn: '123' };

    // @ts-expect-error - fields and maskingRules are mutually exclusive
    masker.erase(data, { fields: ['ssn'], maskingRules: { ssn: {} } });
  });

  it('erase rejects conflicting masking rule strategies', () => {
    const data = { ssn: '123' };

    masker.erase(data, {
      // @ts-expect-error - customMask and dynamicMask are mutually exclusive
      maskingRules: { ssn: { customMask: 'X', dynamicMask: true } },
    });
  });

  it('erase rejects regexPattern without maskFormat', () => {
    const data = { ssn: '123' };

    masker.erase(data, {
      // @ts-expect-error - regexPattern requires maskFormat
      maskingRules: { ssn: { regexPattern: /\d+/ } },
    });
  });

  it('encrypt returns T | string', async () => {
    const data = { secret: 'value' };
    const result = await masker.encrypt(data);

    expectTypeOf(result).toEqualTypeOf<{ secret: string } | string>();
  });

  it('decrypt infers T from the generic parameter', async () => {
    const result = await masker.decrypt<{ secret: string }>('ciphertext');

    expectTypeOf(result).toEqualTypeOf<{ secret: string }>();
  });

  it('decrypt infers T from object input', async () => {
    const data = { ssn: 'encrypted' };
    const result = await masker.decrypt(data, { fields: ['ssn'] });

    expectTypeOf(result).toEqualTypeOf<{ ssn: string }>();
  });
});

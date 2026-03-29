import { describe, expectTypeOf, it } from 'vitest';
import { DataMasking } from '../../src/index.js';

describe('DataMasking type tests', () => {
  const masker = new DataMasking();

  it('erase preserves the input type', () => {
    const data = { name: 'Jane', ssn: '123' };
    const result = masker.erase(data, { fields: ['ssn'] });

    expectTypeOf(result).toEqualTypeOf<{ name: string; ssn: string }>();
  });

  it('erase returns the same type for arrays', () => {
    const data = [1, 2, 3];
    const result = masker.erase(data);

    expectTypeOf(result).toEqualTypeOf<number[]>();
  });

  it('erase returns null for null input', () => {
    const result = masker.erase(null);

    expectTypeOf(result).toEqualTypeOf<null>();
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

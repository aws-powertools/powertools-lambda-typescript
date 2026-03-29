import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  DataMaskingFieldNotFoundError,
  DataMaskingUnsupportedTypeError,
} from '../../src/errors.js';
import { DataMasking } from '../../src/index.js';

describe('DataMasking.erase()', () => {
  const masker = new DataMasking();

  it('masks specified nested fields with default mask value', () => {
    const data = {
      name: 'Jane',
      customer: { ssn: '123-45-6789', city: 'Anytown' },
    };

    const result = masker.erase(data, {
      fields: ['customer.ssn'],
    });

    expect(result.customer.ssn).toBe('*****');
    expect(result.customer.city).toBe('Anytown');
    expect(result.name).toBe('Jane');
  });

  it('masks multiple fields', () => {
    const data = { email: 'j@example.com', phone: '555-1234', name: 'Jane' };

    const result = masker.erase(data, {
      fields: ['email', 'phone'],
    });

    expect(result.email).toBe('*****');
    expect(result.phone).toBe('*****');
    expect(result.name).toBe('Jane');
  });

  it('masks wildcard array paths', () => {
    const data = {
      orders: [
        { id: 1, payment: '4111-1111' },
        { id: 2, payment: '5500-0000' },
      ],
    };

    const result = masker.erase(data, {
      fields: ['orders[*].payment'],
    });

    expect(result.orders[0].payment).toBe('*****');
    expect(result.orders[1].payment).toBe('*****');
    expect(result.orders[0].id).toBe(1);
  });

  it('skips array elements where the nested field is missing', () => {
    const data = {
      items: [
        { id: 1, secret: 'hidden' },
        { id: 2 },
        { id: 3, secret: 'also hidden' },
      ],
    };

    const result = masker.erase(data, {
      fields: ['items[*].secret'],
    });

    expect(result.items[0].secret).toBe('*****');
    expect(result.items[1]).toEqual({ id: 2 });
    expect(result.items[2].secret).toBe('*****');
  });

  it('handles wildcard on an empty array', () => {
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    const data = { orders: [] as unknown[] };

    const result = lenientMasker.erase(data, {
      fields: ['orders[*].payment'],
    });

    expect(result.orders).toEqual([]);
  });

  it('masks a deeply nested field', () => {
    const data = {
      a: { b: { c: { d: { secret: 'hidden', keep: 'visible' } } } },
    };

    const result = masker.erase(data, { fields: ['a.b.c.d.secret'] });

    expect(result.a.b.c.d.secret).toBe('*****');
    expect(result.a.b.c.d.keep).toBe('visible');
  });

  it('returns null/undefined as-is', () => {
    expect(masker.erase(null)).toBeNull();
    expect(masker.erase(undefined)).toBeUndefined();
  });

  it('throws DataMaskingFieldNotFoundError for missing field when throwOnMissingField is true', () => {
    const data = { name: 'Jane' };

    expect(() => masker.erase(data, { fields: ['nonexistent'] })).toThrow(
      DataMaskingFieldNotFoundError
    );
  });

  it('silently skips missing field when throwOnMissingField is false', () => {
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    const data = { name: 'Jane' };

    const result = lenientMasker.erase(data, { fields: ['nonexistent'] });

    expect(result).toEqual({ name: 'Jane' });
  });

  it('handles circular references by cloning them via structuredClone', () => {
    const data: Record<string, unknown> = { name: 'Jane' };
    data.self = data;

    const result = masker.erase(data, { fields: ['name'] });

    expect(result.name).toBe('*****');
  });
});

describe('DataMasking.erase() - custom masking rules', () => {
  const masker = new DataMasking();

  it('applies regex pattern masking', () => {
    const data = { email: 'jane@example.com' };

    const result = masker.erase(data, {
      maskingRules: {
        email: {
          regexPattern: /(.)(.+?)(@.*)/,
          maskFormat: '$1****$3',
        },
      },
    });

    expect(result.email).toBe('j****@example.com');
  });

  it('applies dynamic mask matching original length', () => {
    const data = { ssn: '123-45-6789' };

    const result = masker.erase(data, {
      maskingRules: {
        ssn: { dynamicMask: true },
      },
    });

    expect(result.ssn).toBe('***********');
    expect(result.ssn.length).toBe('123-45-6789'.length);
  });

  it('applies custom mask string', () => {
    const data = { zip: '90210' };

    const result = masker.erase(data, {
      maskingRules: {
        zip: { customMask: 'XXXXX' },
      },
    });

    expect(result.zip).toBe('XXXXX');
  });

  it('throws DataMaskingUnsupportedTypeError for non-string values', () => {
    const data = { age: 30 };

    expect(() =>
      masker.erase(data, {
        maskingRules: {
          age: { dynamicMask: true },
        },
      })
    ).toThrow(DataMaskingUnsupportedTypeError);
  });

  it('applies default mask when no rule options specified', () => {
    const data = { secret: 'hidden' };

    const result = masker.erase(data, {
      maskingRules: {
        secret: {},
      },
    });

    expect(result.secret).toBe('*****');
  });
});

const jmesPathKey = fc.stringMatching(/^[a-z][a-z0-9_]{0,10}$/);

describe('DataMasking.erase() - property tests', () => {
  const masker = new DataMasking();

  it('never mutates the original input', () => {
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    fc.assert(
      fc.property(fc.dictionary(jmesPathKey, fc.jsonValue()), (data) => {
        const original = structuredClone(data);
        lenientMasker.erase(data, { fields: Object.keys(data) });

        expect(data).toEqual(original);
      })
    );
  });

  it('with no fields always returns the default mask', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (data) => {
        if (data === null || data === undefined) return;
        const result = masker.erase(data);

        expect(result).toBe('*****');
      })
    );
  });

  it('replaces every targeted top-level field with the mask', () => {
    fc.assert(
      fc.property(
        fc.dictionary(jmesPathKey, fc.string(), { minKeys: 1 }),
        (data) => {
          const fields = Object.keys(data);
          const result = masker.erase(data, { fields });

          for (const field of fields) {
            expect(result[field]).toBe('*****');
          }
        }
      )
    );
  });
});

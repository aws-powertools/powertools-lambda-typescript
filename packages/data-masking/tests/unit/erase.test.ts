import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DataMaskingConfigurationError,
  DataMaskingFieldNotFoundError,
  DataMaskingUnsupportedTypeError,
} from '../../src/errors.js';
import { DataMasking } from '../../src/index.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DataMasking.erase()', () => {
  const masker = new DataMasking();

  it('masks specified nested fields with default mask value', () => {
    // Prepare
    const data = {
      name: 'Jane',
      customer: { ssn: '123-45-6789', city: 'Anytown' },
    };

    // Act
    const result = masker.erase(data, {
      fields: ['customer.ssn'],
    });

    // Assess
    expect(result.customer.ssn).toBe('*****');
    expect(result.customer.city).toBe('Anytown');
    expect(result.name).toBe('Jane');
  });

  it('masks multiple fields', () => {
    // Prepare
    const data = { email: 'j@example.com', phone: '555-1234', name: 'Jane' };

    // Act
    const result = masker.erase(data, {
      fields: ['email', 'phone'],
    });

    // Assess
    expect(result.email).toBe('*****');
    expect(result.phone).toBe('*****');
    expect(result.name).toBe('Jane');
  });

  it('masks wildcard array paths', () => {
    // Prepare
    const data = {
      orders: [
        { id: 1, payment: '4111-1111' },
        { id: 2, payment: '5500-0000' },
      ],
    };

    // Act
    const result = masker.erase(data, {
      fields: ['orders[*].payment'],
    });

    // Assess
    expect(result.orders[0].payment).toBe('*****');
    expect(result.orders[1].payment).toBe('*****');
    expect(result.orders[0].id).toBe(1);
  });

  it('skips array elements where the nested field is missing', () => {
    // Prepare
    const data = {
      items: [
        { id: 1, secret: 'hidden' },
        { id: 2 },
        { id: 3, secret: 'also hidden' },
      ],
    };

    // Act
    const result = masker.erase(data, {
      fields: ['items[*].secret'],
    });

    // Assess
    expect(result.items[0].secret).toBe('*****');
    expect(result.items[1]).toEqual({ id: 2 });
    expect(result.items[2].secret).toBe('*****');
  });

  it('handles wildcard on an empty array', () => {
    // Prepare
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    const data = { orders: [] as unknown[] };

    // Act
    const result = lenientMasker.erase(data, {
      fields: ['orders[*].payment'],
    });

    // Assess
    expect(result.orders).toEqual([]);
  });

  it('masks a deeply nested field', () => {
    // Prepare
    const data = {
      a: { b: { c: { d: { secret: 'hidden', keep: 'visible' } } } },
    };

    // Act
    const result = masker.erase(data, { fields: ['a.b.c.d.secret'] });

    // Assess
    expect(result.a.b.c.d.secret).toBe('*****');
    expect(result.a.b.c.d.keep).toBe('visible');
  });

  it('returns null/undefined as-is', () => {
    // Act & Assess
    expect(masker.erase(null)).toBeNull();
    expect(masker.erase(undefined)).toBeUndefined();
  });

  it('applies a rule once to a path reached by overlapping field expressions', () => {
    // Prepare
    const data = { a: { b: '123' } };

    // Act
    const result = masker.erase(data, {
      fields: ['a.*', 'a.b'],
      regexPattern: /\d/,
      maskFormat: '#',
    });

    // Assess
    expect(result).toEqual({ a: { b: '###' } });
  });

  it.each([
    { label: 'an empty array', data: { orders: [] } },
    { label: 'an empty object', data: { orders: {} } },
  ])(
    'does not report a wildcard over $label as a missing field',
    ({ data }) => {
      // Act
      const result = masker.erase(data, { fields: ['orders.*.card'] });

      // Assess
      expect(result).toEqual(data);
    }
  );

  it('reports a wildcard whose entries all lack the next segment as missing', () => {
    // Prepare
    const data = { users: { alice: { name: 'Alice' } } };

    // Act & Assess
    expect(() => masker.erase(data, { fields: ['users.*.ssn'] })).toThrow(
      DataMaskingFieldNotFoundError
    );
  });

  it('does not resolve non-index keys on arrays', () => {
    // Prepare
    const data = { items: [1, 2] };

    // Act & Assess
    expect(() => masker.erase(data, { fields: ['items.length'] })).toThrow(
      DataMaskingFieldNotFoundError
    );
  });

  it('masks a field that is present with an undefined value', () => {
    // Prepare
    const data = { ssn: undefined, name: 'Jane' };

    // Act
    const result = masker.erase(data, { fields: ['ssn'] });

    // Assess
    expect(result).toEqual({ ssn: '*****', name: 'Jane' });
  });

  it('throws DataMaskingFieldNotFoundError for missing field when throwOnMissingField is true', () => {
    // Prepare
    const data = { name: 'Jane' };

    // Act & Assess
    expect(() => masker.erase(data, { fields: ['nonexistent'] })).toThrow(
      DataMaskingFieldNotFoundError
    );
  });

  it('skips missing field with a warning when throwOnMissingField is false', () => {
    // Prepare
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    const data = { name: 'Jane' };

    // Act
    const result = lenientMasker.erase(data, { fields: ['nonexistent'] });

    // Assess
    expect(result).toEqual({ name: 'Jane' });
    expect(console.warn).toHaveBeenCalledWith("Field not found: 'nonexistent'");
  });

  it('handles circular references by cloning them via structuredClone', () => {
    // Prepare
    const data: Record<string, unknown> = { name: 'Jane' };
    data.self = data;

    // Act
    const result = masker.erase(data, { fields: ['name'] });

    // Assess
    expect(result.name).toBe('*****');
  });

  it('throws DataMaskingUnsupportedTypeError for non-cloneable data', () => {
    // Prepare
    const data = { fn: () => {} };

    // Act & Assess
    expect(() => masker.erase(data, { fields: ['fn'] })).toThrow(
      DataMaskingUnsupportedTypeError
    );
  });

  it('masks all properties of an object with .* wildcard', () => {
    // Prepare
    const data = {
      credentials: { username: 'admin', password: 's3cret', token: 'abc123' },
    };

    // Act
    const result = masker.erase(data, { fields: ['credentials.*'] });

    // Assess
    expect(result.credentials.username).toBe('*****');
    expect(result.credentials.password).toBe('*****');
    expect(result.credentials.token).toBe('*****');
  });

  it('masks nested fields via .* on an intermediate object', () => {
    // Prepare
    const data = {
      users: {
        alice: { ssn: '111', name: 'Alice' },
        bob: { ssn: '222', name: 'Bob' },
      },
    };

    // Act
    const result = masker.erase(data, { fields: ['users.*.ssn'] });

    // Assess
    expect(result.users.alice.ssn).toBe('*****');
    expect(result.users.bob.ssn).toBe('*****');
    expect(result.users.alice.name).toBe('Alice');
    expect(result.users.bob.name).toBe('Bob');
  });

  it('masks an own __proto__ key during .* object wildcard traversal', () => {
    // Prepare
    const data = JSON.parse(
      '{"secrets": {"__proto__": "injected", "safe": "value"}}'
    );

    // Act
    const result = masker.erase(data, { fields: ['secrets.*'] });

    // Assess
    expect(result.secrets.safe).toBe('*****');
    expect(
      Object.getOwnPropertyDescriptor(result.secrets, '__proto__')
    ).toEqual({
      value: '*****',
      writable: true,
      enumerable: true,
      configurable: true,
    });
    expect(Object.getPrototypeOf(result.secrets)).toBe(Object.prototype);
  });

  it('masks an own __proto__ key named as an explicit field', () => {
    // Prepare
    const data = JSON.parse('{"__proto__": "injected", "safe": "value"}');

    // Act
    const result = masker.erase(data, { fields: ['__proto__'] });

    // Assess
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toBe(
      '*****'
    );
    expect(result.safe).toBe('value');
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it.each([
    { label: 'constructor', field: 'constructor' },
    { label: 'prototype', field: 'prototype' },
  ])('masks an own $label key named as an explicit field', ({ field }) => {
    // Prepare
    const data = JSON.parse(`{"${field}": "secret", "safe": "value"}`);

    // Act
    const result = masker.erase(data, { fields: [field, 'safe'] });

    // Assess
    expect(result[field]).toBe('*****');
    expect(result.safe).toBe('*****');
    expect(Object.prototype.constructor).toBe(Object);
  });

  it('masks through an own __proto__ key without polluting Object.prototype', () => {
    // Prepare
    const data = JSON.parse('{"__proto__": {"polluted": "yes"}}');

    // Act
    const result = masker.erase(data, { fields: ['__proto__.polluted'] });

    // Assess
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual(
      {
        polluted: '*****',
      }
    );
    expect({}).not.toHaveProperty('polluted');
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it('masks own reserved keys reached by a top-level rule', () => {
    // Prepare
    const data = JSON.parse(
      '{"constructor": "secret", "__proto__": "injected", "a": "x"}'
    );

    // Act
    const result = masker.erase(data, { customMask: 'X' });

    // Assess
    expect(result.constructor).toBe('X');
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toBe(
      'X'
    );
    expect(result.a).toBe('X');
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it.each([
    { label: 'an inherited key', field: 'constructor' },
    { label: 'an empty expression', field: '' },
  ])('reports $label as a missing field', ({ field }) => {
    // Prepare
    const data = JSON.parse(
      '{"secrets": {"__proto__": "injected", "safe": "value"}}'
    );

    // Act & Assess
    expect(() => masker.erase(data, { fields: [field] })).toThrow(
      DataMaskingFieldNotFoundError
    );
    expect(Object.getPrototypeOf(data)).toBe(Object.prototype);
  });

  it('prevents prototype pollution when __proto__ is used as a direct field path', () => {
    // Prepare
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    const data = { safe: 'value' };

    // Act
    const result = lenientMasker.erase(data, {
      fields: ['__proto__', 'constructor', 'safe'],
    });

    // Assess
    expect(result.safe).toBe('*****');
    expect(Object.getPrototypeOf(result)).toEqual(Object.getPrototypeOf({}));
  });

  it('prevents prototype pollution on nested paths like foo.__proto__', () => {
    // Prepare
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    const data = { foo: { bar: 'value' } };

    // Act
    const result = lenientMasker.erase(data, {
      fields: ['foo.__proto__', 'foo.bar'],
    });

    // Assess
    expect(result.foo.bar).toBe('*****');
    expect(Object.getPrototypeOf(result.foo)).toEqual(
      Object.getPrototypeOf({})
    );
  });

  it('skips primitives inside array wildcard paths', () => {
    // Prepare
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    const data = { items: ['a', 'b', 'c'] };

    // Act
    const result = lenientMasker.erase(data, {
      fields: ['items[*].nested'],
    });

    // Assess
    expect(result.items).toEqual(['a', 'b', 'c']);
  });
});

describe('DataMasking.erase() - custom masking rules', () => {
  const masker = new DataMasking();

  it('applies regex pattern masking', () => {
    // Prepare
    const data = { email: 'jane@example.com' };

    // Act
    const result = masker.erase(data, {
      maskingRules: {
        email: {
          regexPattern: /^(.)([^@]*)(@.*)$/,
          maskFormat: '$1****$3',
        },
      },
    });

    // Assess
    expect(result.email).toBe('j****@example.com');
  });

  it('replaces every occurrence of a pattern that lacks the g flag', () => {
    // Prepare
    const data = { card: '1111 2222' };

    // Act
    const result = masker.erase(data, {
      maskingRules: { card: { regexPattern: /\d{4}/, maskFormat: '####' } },
    });

    // Assess
    expect(result.card).toBe('#### ####');
  });

  it('applies the default mask value when a pattern matches nothing', () => {
    // Prepare
    const data = { ssn: '123456789' };

    // Act
    const result = masker.erase(data, {
      maskingRules: {
        ssn: { regexPattern: /\d{3}-\d{2}-(\d{4})/, maskFormat: '***-**-$1' },
      },
    });

    // Assess
    expect(result.ssn).toBe('*****');
  });

  it('keeps a match whose replacement equals the original value', () => {
    // Prepare
    const data = { tag: 'abc' };

    // Act
    const result = masker.erase(data, {
      maskingRules: { tag: { regexPattern: /b/, maskFormat: 'b' } },
    });

    // Assess
    expect(result.tag).toBe('abc');
  });

  it('ignores the match state of a reused pattern', () => {
    // Prepare
    const data = { ssn: '123-45-6789' };
    const regexPattern = /\d{3}/g;
    regexPattern.lastIndex = 8;

    // Act
    const first = masker.erase(data, {
      maskingRules: { ssn: { regexPattern, maskFormat: '#' } },
    });
    const second = masker.erase(data, {
      maskingRules: { ssn: { regexPattern, maskFormat: '#' } },
    });

    // Assess
    expect(first.ssn).toBe('#-45-#9');
    expect(second.ssn).toBe('#-45-#9');
    expect(regexPattern.lastIndex).toBe(8);
  });

  it('applies a rule to every element of an array, keeping its structure', () => {
    // Prepare
    const data = { cards: ['4111-1111', '4222-2222'] };

    // Act
    const result = masker.erase(data, {
      maskingRules: {
        cards: { regexPattern: /4111-\d{4}/, maskFormat: 'XXXX' },
      },
    });

    // Assess
    expect(result.cards).toEqual(['XXXX', '*****']);
  });

  it('applies a rule to every leaf of a nested object', () => {
    // Prepare
    const data = {
      customer: { ssn: '123-45-6789', orders: [{ card: '4111' }] },
    };

    // Act
    const result = masker.erase(data, {
      maskingRules: { customer: { customMask: 'X' } },
    });

    // Assess
    expect(result).toEqual({ customer: { ssn: 'X', orders: [{ card: 'X' }] } });
  });

  it('masks a leaf that is neither a primitive nor a container', () => {
    // Prepare
    const data = { when: new Date(0) };

    // Act
    const result = masker.erase(data, {
      maskingRules: { when: { customMask: 'X' } },
    });

    // Assess
    expect(result.when).toBe('X');
  });

  it('throws DataMaskingFieldNotFoundError for a rule that matches no field when throwOnMissingField is true', () => {
    // Prepare
    const data = { ssn: '123-45-6789' };

    // Act & Assess
    expect(() =>
      masker.erase(data, { maskingRules: { snn: { dynamicMask: true } } })
    ).toThrow(DataMaskingFieldNotFoundError);
  });

  it('skips a rule that matches no field with a warning when throwOnMissingField is false', () => {
    // Prepare
    const lenientMasker = new DataMasking({ throwOnMissingField: false });
    const data = { ssn: '123-45-6789', name: 'Jane' };

    // Act
    const result = lenientMasker.erase(data, {
      maskingRules: {
        snn: { dynamicMask: true },
        name: { customMask: 'XXXX' },
      },
    });

    // Assess
    expect(result).toEqual({ ssn: '123-45-6789', name: 'XXXX' });
    expect(console.warn).toHaveBeenCalledWith("Field not found: 'snn'");
  });

  it.each([
    { order: 'parent first', rules: ['a', 'a.b'] },
    { order: 'child first', rules: ['a.b', 'a'] },
  ])(
    'resolves every rule before masking so key order does not matter ($order)',
    ({ rules }) => {
      // Prepare
      const data = { a: { b: 'x' } };
      const maskingRules = Object.fromEntries(
        rules.map((field) => [field, { customMask: 'M' }])
      );

      // Act
      const result = masker.erase(data, { maskingRules });

      // Assess
      expect(result).toEqual({ a: { b: 'M' } });
    }
  );

  it('does not report a field as missing when a rule covers its parent', () => {
    // Prepare
    const data = { a: { b: 'x' } };

    // Act
    const result = masker.erase(data, {
      fields: ['a.b'],
      maskingRules: { a: { customMask: 'M' } },
    });

    // Assess
    expect(result).toEqual({ a: { b: 'M' } });
  });

  it('lets a rule on a parent see the original values of its children', () => {
    // Prepare
    const data = { cards: ['4111', '4222'] };

    // Act
    const result = masker.erase(data, {
      fields: ['cards[*]'],
      maskingRules: { cards: { dynamicMask: true } },
    });

    // Assess
    expect(result).toEqual({ cards: ['****', '****'] });
  });

  it('applies the first rule given to a path reached by several expressions', () => {
    // Prepare
    const data = { a: { b: '123' } };

    // Act
    const result = masker.erase(data, {
      maskingRules: {
        'a.*': { customMask: 'X' },
        'a.b': { dynamicMask: true },
      },
    });

    // Assess
    expect(result).toEqual({ a: { b: 'X' } });
  });

  it('does not report a wildcard over an empty collection as a missing field', () => {
    // Prepare
    const data = { orders: [] };

    // Act
    const result = masker.erase(data, {
      maskingRules: { 'orders[*].card': { dynamicMask: true } },
    });

    // Assess
    expect(result).toEqual({ orders: [] });
  });

  it('passes a present but undefined value through a masking rule', () => {
    // Prepare
    const data = { ssn: undefined, name: 'Jane' };

    // Act
    const result = masker.erase(data, {
      maskingRules: { ssn: { customMask: 'X' }, name: { customMask: 'X' } },
    });

    // Assess
    expect(result).toEqual({ ssn: undefined, name: 'X' });
  });

  it('applies dynamic mask matching original length', () => {
    // Prepare
    const data = { ssn: '123-45-6789' };

    // Act
    const result = masker.erase(data, {
      maskingRules: {
        ssn: { dynamicMask: true },
      },
    });

    // Assess
    expect(result.ssn).toBe('***********');
    expect(result.ssn.length).toBe('123-45-6789'.length);
  });

  it('applies custom mask string', () => {
    // Prepare
    const data = { zip: '90210' };

    // Act
    const result = masker.erase(data, {
      maskingRules: {
        zip: { customMask: 'XXXXX' },
      },
    });

    // Assess
    expect(result.zip).toBe('XXXXX');
  });

  it('stringifies non-string values before applying a rule', () => {
    // Prepare
    const data: Record<string, unknown> = { age: 30 };

    // Act
    const result = masker.erase(data, {
      maskingRules: {
        age: { dynamicMask: true },
      },
    });

    // Assess
    expect(result.age).toBe('**'); // String(30) -> '30' -> '**'
  });

  it('applies default mask when no rule options specified', () => {
    // Prepare
    const data = { secret: 'hidden' };

    // Act
    const result = masker.erase(data, {
      maskingRules: {
        secret: {},
      },
    });

    // Assess
    expect(result.secret).toBe('*****');
  });
});

describe('DataMasking.erase() - options validation', () => {
  const masker = new DataMasking();
  const data = { ssn: '123-45-6789' };

  it('throws when fields is an empty array', () => {
    // Act & Assess
    expect(() => masker.erase(data, { fields: [] })).toThrow(
      DataMaskingConfigurationError
    );
  });

  it('throws when maskingRules is an empty object', () => {
    // Act & Assess
    expect(() => masker.erase(data, { maskingRules: {} })).toThrow(
      DataMaskingConfigurationError
    );
  });

  it.each([
    {
      label: 'a top-level rule',
      options: { regexPattern: /\d{3}-\d{2}-\d{4}/y, maskFormat: '***' },
    },
    {
      label: 'a per-field rule',
      options: {
        maskingRules: {
          ssn: { regexPattern: /\d{3}-\d{2}-\d{4}/y, maskFormat: '***' },
        },
      },
    },
  ])('throws for a sticky pattern given as $label', ({ options }) => {
    // Act & Assess
    expect(() => masker.erase(data, options)).toThrow(
      new DataMaskingConfigurationError(
        "Sticky regex patterns are not supported: remove the 'y' flag from /\\d{3}-\\d{2}-\\d{4}/y"
      )
    );
  });
});

describe('DataMasking.erase() - top-level masking rule', () => {
  const masker = new DataMasking();

  it('applies a top-level rule to every listed field', () => {
    // Prepare
    const data = { ssn: '123-45-6789', card: '4111-1111', name: 'Jane' };

    // Act
    const result = masker.erase(data, {
      fields: ['ssn', 'card'],
      dynamicMask: true,
    });

    // Assess
    expect(result.ssn).toBe('***********');
    expect(result.card).toBe('*********');
    expect(result.name).toBe('Jane');
  });

  it('lets per-field maskingRules override the top-level rule', () => {
    // Prepare
    const data = { ssn: '123-45-6789', card: '4111-1111' };

    // Act
    const result = masker.erase(data, {
      fields: ['ssn', 'card'],
      dynamicMask: true,
      maskingRules: {
        card: { customMask: 'XXXX' },
      },
    });

    // ssn falls through to the top-level dynamic mask, card uses its own rule

    // Assess
    expect(result.ssn).toBe('***********');
    expect(result.card).toBe('XXXX');
  });

  it('masks fields named only in maskingRules even without listing them in fields', () => {
    // Prepare
    const data = { ssn: '123-45-6789', card: '4111-1111', name: 'Jane' };

    // Act
    const result = masker.erase(data, {
      fields: ['ssn'],
      dynamicMask: true,
      maskingRules: {
        card: { customMask: 'XXXX' },
      },
    });

    // Assess
    expect(result.ssn).toBe('***********');
    expect(result.card).toBe('XXXX');
    expect(result.name).toBe('Jane');
  });

  it('applies a top-level rule to every leaf when no fields are given', () => {
    // Prepare
    const data = {
      ssn: '123-45-6789',
      customer: { card: '4111', city: 'Anytown' },
    };

    // Act
    const result = masker.erase(data, { dynamicMask: true });

    // Assess
    expect(result.ssn).toBe('***********');
    expect(result.customer.card).toBe('****');
    expect(result.customer.city).toBe('*******');
  });

  it('stringifies non-string leaves when applying a top-level rule to all leaves', () => {
    // Prepare
    const data: Record<string, unknown> = { age: 30, active: true };

    // Act
    const result = masker.erase(data, {
      dynamicMask: true,
    });

    // Assess
    expect(result.age).toBe('**'); // String(30) -> '30' -> '**'
    expect(result.active).toBe('****'); // String(true) -> 'true' -> '****'
  });

  it('applies a top-level rule to array elements element-wise', () => {
    // Prepare
    const data = { cards: ['4111', '5500-0000'] };

    // Act
    const result = masker.erase(data, { dynamicMask: true });

    // Assess
    expect(result.cards).toEqual(['****', '*********']);
  });

  it('masks a top-level scalar payload with a top-level rule', () => {
    // Act
    const result = masker.erase('123-45-6789', { dynamicMask: true });

    // Assess
    expect(result).toBe('***********');
  });

  it('passes null/undefined leaves through unchanged when masking all leaves', () => {
    // Prepare
    const data: Record<string, unknown> = {
      ssn: '123',
      maybe: null,
      missing: undefined,
    };

    // Act
    const result = masker.erase(data, { customMask: 'X' });

    // Assess
    expect(result.ssn).toBe('X');
    expect(result.maybe).toBeNull();
    expect(result.missing).toBeUndefined();
  });

  it('stringifies non-string fields before applying a top-level rule', () => {
    // Prepare
    const data: Record<string, unknown> = { age: 30 };

    // Act
    const result = masker.erase(data, {
      fields: ['age'],
      dynamicMask: true,
    });

    // Assess
    expect(result.age).toBe('**'); // String(30) -> '30' -> '**'
  });

  it('applies a top-level regex rule across listed fields', () => {
    // Prepare
    const data = { primary: 'jane@example.com', backup: 'bob@example.com' };

    // Act
    const result = masker.erase(data, {
      fields: ['primary', 'backup'],
      regexPattern: /^(.)([^@]*)(@.*)$/,
      maskFormat: '$1****$3',
    });

    // Assess
    expect(result.primary).toBe('j****@example.com');
    expect(result.backup).toBe('b****@example.com');
  });

  it('applies a top-level rule to each leaf of a listed container field', () => {
    // Prepare
    const data = { cards: ['4111-1111', '4222-2222'], name: 'Jane' };

    // Act
    const result = masker.erase(data, {
      fields: ['cards'],
      regexPattern: /4111-\d{4}/,
      maskFormat: 'XXXX',
    });

    // Assess
    expect(result.cards).toEqual(['XXXX', '*****']);
    expect(result.name).toBe('Jane');
  });

  it('masks leaves that are neither primitives nor containers', () => {
    // Prepare
    const data = { when: new Date(0), tags: new Set(['a']) };

    // Act
    const result = masker.erase(data, { customMask: 'X' });

    // Assess
    expect(result.when).toBe('X');
    expect(result.tags).toBe('X');
  });
});

const pathKey = fc.stringMatching(/^[a-z][a-z0-9_]{0,10}$/);

describe('DataMasking.erase() - property tests', () => {
  const masker = new DataMasking();

  it('never mutates the original input', () => {
    // Prepare
    const lenientMasker = new DataMasking({ throwOnMissingField: false });

    // Act & Assess
    fc.assert(
      fc.property(
        fc.dictionary(pathKey, fc.jsonValue(), { minKeys: 1 }),
        (data) => {
          const original = structuredClone(data);
          lenientMasker.erase(data, { fields: Object.keys(data) });

          expect(data).toEqual(original);
        }
      )
    );
  });

  it('with no fields returns the default mask, masking arrays element-wise', () => {
    // Act & Assess
    fc.assert(
      fc.property(fc.jsonValue(), (data) => {
        if (data === null || data === undefined) return;
        const result = masker.erase(data);

        if (Array.isArray(data)) {
          expect(result).toEqual(data.map(() => '*****'));
        } else {
          expect(result).toBe('*****');
        }
      })
    );
  });

  it('replaces every value under parent.* with the mask', () => {
    // Act & Assess
    fc.assert(
      fc.property(
        pathKey,
        fc.dictionary(pathKey, fc.string(), { minKeys: 1 }),
        (parent, nested) => {
          const data = { [parent]: nested };
          const result = masker.erase(data, {
            fields: [`${parent}.*`],
          });

          for (const key of Object.keys(nested)) {
            expect((result[parent] as Record<string, unknown>)[key]).toBe(
              '*****'
            );
          }
        }
      )
    );
  });

  it('masks nested field under each key with parent.*.child', () => {
    // Act & Assess
    fc.assert(
      fc.property(
        pathKey,
        pathKey.filter((key) => key !== 'keep'),
        fc.dictionary(
          pathKey,
          fc.record({ secret: fc.string(), keep: fc.string() }),
          { minKeys: 1 }
        ),
        (parent, child, nested) => {
          const inner = Object.fromEntries(
            Object.entries(nested).map(([k, v]) => [
              k,
              { [child]: v.secret, keep: v.keep },
            ])
          );
          const data = { [parent]: inner };
          const result = masker.erase(data, {
            fields: [`${parent}.*.${child}`],
          }) as Record<string, Record<string, Record<string, unknown>>>;

          for (const key of Object.keys(inner)) {
            expect(result[parent][key][child]).toBe('*****');
            expect(result[parent][key].keep).toBe(inner[key].keep);
          }
        }
      )
    );
  });

  it('replaces every element field under parent[*].child with the mask', () => {
    // Act & Assess
    fc.assert(
      fc.property(
        pathKey,
        pathKey.filter((key) => key !== 'keep'),
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        (parent, child, values) => {
          const data = {
            [parent]: values.map((v) => ({ [child]: v, keep: 'visible' })),
          };
          const result = masker.erase(data, {
            fields: [`${parent}[*].${child}`],
          }) as Record<string, Record<string, unknown>[]>;

          for (let i = 0; i < values.length; i++) {
            expect(result[parent][i][child]).toBe('*****');
            expect(result[parent][i].keep).toBe('visible');
          }
        }
      )
    );
  });

  it('[*] skips array elements missing the targeted field', () => {
    // Act & Assess
    fc.assert(
      fc.property(
        pathKey,
        pathKey.filter((key) => key !== 'id'),
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        (parent, child, values) => {
          const items = values.map((v, i) =>
            i % 2 === 0 ? { [child]: v, id: i } : { id: i }
          );
          const data = { [parent]: items };
          const result = masker.erase(data, {
            fields: [`${parent}[*].${child}`],
          }) as Record<string, Record<string, unknown>[]>;

          for (let i = 0; i < items.length; i++) {
            if (i % 2 === 0) {
              expect(result[parent][i][child]).toBe('*****');
            } else {
              expect(result[parent][i][child]).toBeUndefined();
            }
            expect(result[parent][i].id).toBe(i);
          }
        }
      )
    );
  });

  it('replaces every targeted top-level field with the mask', () => {
    // Act & Assess
    fc.assert(
      fc.property(
        fc.dictionary(pathKey, fc.string(), { minKeys: 1 }),
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

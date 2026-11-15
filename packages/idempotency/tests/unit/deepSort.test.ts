import { describe, expect, it } from 'vitest';
import { deepSort } from '../../src/deepSort.js';

describe('Function: deepSort', () => {
  it('can sort string correctly', () => {
    expect(deepSort('test')).toEqual('test');
  });

  it('can sort number correctly', () => {
    expect(deepSort(5)).toEqual(5);
  });

  it('can sort boolean correctly', () => {
    expect(deepSort(true)).toEqual(true);
    expect(deepSort(false)).toEqual(false);
  });

  it('can sort null correctly', () => {
    expect(deepSort(null)).toEqual(null);
  });

  it('can sort undefined correctly', () => {
    expect(deepSort(undefined)).toEqual(undefined);
  });

  it('can sort object with nested keys correctly', () => {
    // Prepare
    const input = {
      name: 'John',
      age: 30,
      city: 'New York',
      address: {
        street: '5th Avenue',
        number: 123,
      },
    };

    // Act
    const result = deepSort(input);

    // Assess
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        address: {
          number: 123,
          street: '5th Avenue',
        },
        age: 30,
        city: 'New York',
        name: 'John',
      })
    );
  });

  it('can sort deeply nested structures', () => {
    // Prepare
    const input = {
      z: [{ b: { d: 4, c: 3 }, a: { f: 6, e: 5 } }],
      a: { c: 3, b: 2, a: 1 },
    };

    // Act
    const result = deepSort(input);

    //Assess
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        a: { a: 1, b: 2, c: 3 },
        z: [{ a: { e: 5, f: 6 }, b: { c: 3, d: 4 } }],
      })
    );
  });

  it('can sort JSON array with objects containing words as keys and nested objects/arrays correctly', () => {
    // Prepare
    const input = [
      {
        transactions: [
          50,
          40,
          { field: 'a', category: 'x', purpose: 's' },
          [
            {
              zone: 'c',
              warehouse: 'd',
              attributes: { region: 'a', quality: 'x', batch: 's' },
            },
          ],
        ],
        totalAmount: 30,
        customerName: 'John',
        location: 'New York',
        transactionType: 'a',
      },
      {
        customerName: 'John',
        location: 'New York',
        transactionDetails: [
          { field: 'a', category: 'x', purpose: 's' },
          null,
          50,
          [{ zone: 'c', warehouse: 'd', attributes: 't' }],
          40,
        ],
        amount: 30,
      },
    ];

    // Act
    const result = deepSort(input);

    // Assess
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify([
        {
          customerName: 'John',
          location: 'New York',
          totalAmount: 30,
          transactions: [
            50,
            40,
            { category: 'x', field: 'a', purpose: 's' },
            [
              {
                attributes: { batch: 's', quality: 'x', region: 'a' },
                warehouse: 'd',
                zone: 'c',
              },
            ],
          ],
          transactionType: 'a',
        },
        {
          amount: 30,
          customerName: 'John',
          location: 'New York',
          transactionDetails: [
            { category: 'x', field: 'a', purpose: 's' },
            null,
            50,
            [{ attributes: 't', warehouse: 'd', zone: 'c' }],
            40,
          ],
        },
      ])
    );
  });

  it('handles empty objects and arrays correctly', () => {
    expect(deepSort({})).toEqual({});
    expect(deepSort([])).toEqual([]);
  });

  it('keeps a `__proto__` key as a regular property', () => {
    // Prepare
    const input = JSON.parse(
      '{"orderId":"A","__proto__":{"status":"pending"}}'
    );

    // Act
    const result = deepSort(input);

    // Assess
    expect(JSON.stringify(result)).toEqual(
      '{"__proto__":{"status":"pending"},"orderId":"A"}'
    );
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it.each([
    { input: '{"a":1,"A":2,"b":3}' },
    { input: '{"A":2,"a":1,"b":3}' },
    { input: '{"b":3,"a":1,"A":2}' },
  ])(
    'sorts keys that differ only in case deterministically ($input)',
    ({ input }) => {
      // Act
      const result = deepSort(JSON.parse(input));

      // Assess
      expect(JSON.stringify(result)).toEqual('{"A":2,"a":1,"b":3}');
    }
  );
});

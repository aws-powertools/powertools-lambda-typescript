/**
 * Test sort function
 *
 * @group unit/commons/sort
 */

import { sort } from '../../src/sort';

describe('Function: sort', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('can sort string correctly', () => {
    expect(sort('test')).toEqual('test');
  });

  test('can sort number correctly', () => {
    expect(sort(5)).toEqual(5);
  });

  test('can sort boolean correctly', () => {
    expect(sort(true)).toEqual(true);
    expect(sort(false)).toEqual(false);
  });

  test('can sort null correctly', () => {
    expect(sort(null)).toEqual(null);
  });

  test('can sort undefined correctly', () => {
    expect(sort(undefined)).toEqual(undefined);
  });

  test('can sort object with nested keys correctly', () => {
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
    const result = sort(input);

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

  test('can sort deeply nested structures', () => {
    // Prepare
    const input = {
      z: [{ b: { d: 4, c: 3 }, a: { f: 6, e: 5 } }],
      a: { c: 3, b: 2, a: 1 },
    };

    // Act
    const result = sort(input);

    //Assess
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        a: { a: 1, b: 2, c: 3 },
        z: [{ a: { e: 5, f: 6 }, b: { c: 3, d: 4 } }],
      })
    );
  });

  test('can sort JSON array with objects containing words as keys and nested objects/arrays correctly', () => {
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
    const result = sort(input);

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

  test('handles empty objects and arrays correctly', () => {
    expect(sort({})).toEqual({});
    expect(sort([])).toEqual([]);
  });
});

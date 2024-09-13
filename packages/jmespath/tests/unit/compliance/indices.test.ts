import { describe, expect, it } from 'vitest';
import { search } from '../../../src/index.js';

describe('Indices tests', () => {
  it.each([
    {
      expression: 'foo.bar[0]',
      expected: 'zero',
    },
    {
      expression: 'foo.bar[1]',
      expected: 'one',
    },
    {
      expression: 'foo.bar[2]',
      expected: 'two',
    },
    {
      expression: 'foo.bar[3]',
      expected: null,
    },
    {
      expression: 'foo.bar[-1]',
      expected: 'two',
    },
    {
      expression: 'foo.bar[-2]',
      expected: 'one',
    },
    {
      expression: 'foo.bar[-3]',
      expected: 'zero',
    },
    {
      expression: 'foo.bar[-4]',
      expected: null,
    },
  ])(
    'should support indices on arrays in a nested object: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: { bar: ['zero', 'one', 'two'] } };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo.bar',
      expected: null,
    },
    {
      expression: 'foo[0].bar',
      expected: 'one',
    },
    {
      expression: 'foo[1].bar',
      expected: 'two',
    },
    {
      expression: 'foo[2].bar',
      expected: 'three',
    },
    {
      expression: 'foo[3].notbar',
      expected: 'four',
    },
    {
      expression: 'foo[3].bar',
      expected: null,
    },
    {
      expression: 'foo[0]',
      expected: { bar: 'one' },
    },
    {
      expression: 'foo[1]',
      expected: { bar: 'two' },
    },
    {
      expression: 'foo[2]',
      expected: { bar: 'three' },
    },
    {
      expression: 'foo[3]',
      expected: { notbar: 'four' },
    },
    {
      expression: 'foo[4]',
      expected: null,
    },
  ])(
    'should support indices in an array with objects inside: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          { bar: 'one' },
          { bar: 'two' },
          { bar: 'three' },
          { notbar: 'four' },
        ],
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: '[0]',
      expected: 'one',
    },
    {
      expression: '[1]',
      expected: 'two',
    },
    {
      expression: '[2]',
      expected: 'three',
    },
    {
      expression: '[-1]',
      expected: 'three',
    },
    {
      expression: '[-2]',
      expected: 'two',
    },
    {
      expression: '[-3]',
      expected: 'one',
    },
  ])(
    'should support indices in an array: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = ['one', 'two', 'three'];

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'reservations[].instances[].foo',
      expected: [1, 2],
    },
    {
      expression: 'reservations[].instances[].bar',
      expected: [],
    },
    {
      expression: 'reservations[].notinstances[].foo',
      expected: [],
    },
    {
      expression: 'reservations[].notinstances[].foo',
      expected: [],
    },
  ])(
    'should support indices in multi-level nested arrays & objects: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = { reservations: [{ instances: [{ foo: 1 }, { foo: 2 }] }] };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'reservations[].instances[].foo[].bar',
      expected: [1, 2, 4, 5, 6, 8],
    },
    {
      expression: 'reservations[].instances[].foo[].baz',
      expected: [],
    },
    {
      expression: 'reservations[].instances[].notfoo[].bar',
      expected: [20, 21, 22, 23, 24, 25],
    },
    {
      expression: 'reservations[].instances[].notfoo[].notbar',
      expected: [[7], [7]],
    },
    {
      expression: 'reservations[].notinstances[].foo',
      expected: [],
    },
    {
      expression: 'reservations[].instances[].foo[].notbar',
      expected: [3, [7]],
    },
    {
      expression: 'reservations[].instances[].bar[].baz',
      expected: [[1], [2], [3], [4]],
    },
    {
      expression: 'reservations[].instances[].baz[].baz',
      expected: [[1, 2], [], [], [3, 4]],
    },
    {
      expression: 'reservations[].instances[].qux[].baz',
      expected: [[], [1, 2, 3], [4], [], [], [1, 2, 3], [4], []],
    },
    {
      expression: 'reservations[].instances[].qux[].baz[]',
      expected: [1, 2, 3, 4, 1, 2, 3, 4],
    },
  ])(
    'should support indices in large mixed objects and arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        reservations: [
          {
            instances: [
              { foo: [{ bar: 1 }, { bar: 2 }, { notbar: 3 }, { bar: 4 }] },
              { foo: [{ bar: 5 }, { bar: 6 }, { notbar: [7] }, { bar: 8 }] },
              { foo: 'bar' },
              {
                notfoo: [
                  { bar: 20 },
                  { bar: 21 },
                  { notbar: [7] },
                  { bar: 22 },
                ],
              },
              { bar: [{ baz: [1] }, { baz: [2] }, { baz: [3] }, { baz: [4] }] },
              {
                baz: [
                  { baz: [1, 2] },
                  { baz: [] },
                  { baz: [] },
                  { baz: [3, 4] },
                ],
              },
              {
                qux: [
                  { baz: [] },
                  { baz: [1, 2, 3] },
                  { baz: [4] },
                  { baz: [] },
                ],
              },
            ],
            otherkey: {
              foo: [{ bar: 1 }, { bar: 2 }, { notbar: 3 }, { bar: 4 }],
            },
          },
          {
            instances: [
              { a: [{ bar: 1 }, { bar: 2 }, { notbar: 3 }, { bar: 4 }] },
              { b: [{ bar: 5 }, { bar: 6 }, { notbar: [7] }, { bar: 8 }] },
              { c: 'bar' },
              {
                notfoo: [
                  { bar: 23 },
                  { bar: 24 },
                  { notbar: [7] },
                  { bar: 25 },
                ],
              },
              {
                qux: [
                  { baz: [] },
                  { baz: [1, 2, 3] },
                  { baz: [4] },
                  { baz: [] },
                ],
              },
            ],
            otherkey: {
              foo: [{ bar: 1 }, { bar: 2 }, { notbar: 3 }, { bar: 4 }],
            },
          },
        ],
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo[]',
      expected: [
        ['one', 'two'],
        ['three', 'four'],
        ['five', 'six'],
        ['seven', 'eight'],
        ['nine'],
        ['ten'],
      ],
    },
    {
      expression: 'foo[][0]',
      expected: ['one', 'three', 'five', 'seven', 'nine', 'ten'],
    },
    {
      expression: 'foo[][1]',
      expected: ['two', 'four', 'six', 'eight'],
    },
    {
      expression: 'foo[][0][0]',
      expected: [],
    },
    {
      expression: 'foo[][2][2]',
      expected: [],
    },
    {
      expression: 'foo[][0][0][100]',
      expected: [],
    },
  ])(
    'should support indices in objects containing an array of matrixes: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          [
            ['one', 'two'],
            ['three', 'four'],
          ],
          [
            ['five', 'six'],
            ['seven', 'eight'],
          ],
          [['nine'], ['ten']],
        ],
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo',
      expected: [
        {
          bar: [
            { qux: 2, baz: 1 },
            { qux: 4, baz: 3 },
          ],
        },
        {
          bar: [
            { qux: 6, baz: 5 },
            { qux: 8, baz: 7 },
          ],
        },
      ],
    },
    {
      expression: 'foo[]',
      expected: [
        {
          bar: [
            { qux: 2, baz: 1 },
            { qux: 4, baz: 3 },
          ],
        },
        {
          bar: [
            { qux: 6, baz: 5 },
            { qux: 8, baz: 7 },
          ],
        },
      ],
    },
    {
      expression: 'foo[].bar',
      expected: [
        [
          { qux: 2, baz: 1 },
          { qux: 4, baz: 3 },
        ],
        [
          { qux: 6, baz: 5 },
          { qux: 8, baz: 7 },
        ],
      ],
    },
    {
      expression: 'foo[].bar[]',
      expected: [
        { qux: 2, baz: 1 },
        { qux: 4, baz: 3 },
        { qux: 6, baz: 5 },
        { qux: 8, baz: 7 },
      ],
    },
    {
      expression: 'foo[].bar[].baz',
      expected: [1, 3, 5, 7],
    },
  ])(
    'should support indices with nested arrays and objects at different levels: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          {
            bar: [
              {
                qux: 2,
                baz: 1,
              },
              {
                qux: 4,
                baz: 3,
              },
            ],
          },
          {
            bar: [
              {
                qux: 6,
                baz: 5,
              },
              {
                qux: 8,
                baz: 7,
              },
            ],
          },
        ],
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'string[]',
      expected: null,
    },
    {
      expression: 'hash[]',
      expected: null,
    },
    {
      expression: 'number[]',
      expected: null,
    },
    {
      expression: 'nullvalue[]',
      expected: null,
    },
    {
      expression: 'string[].foo',
      expected: null,
    },
    {
      expression: 'hash[].foo',
      expected: null,
    },
    {
      expression: 'number[].foo',
      expected: null,
    },
    {
      expression: 'nullvalue[].foo',
      expected: null,
    },
    {
      expression: 'nullvalue[].foo[].bar',
      expected: null,
    },
  ])(
    'should support indices in objects having special names as keys: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        string: 'string',
        hash: { foo: 'bar', bar: 'baz' },
        number: 23,
        nullvalue: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

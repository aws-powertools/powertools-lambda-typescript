import { describe, expect, it } from 'vitest';
import { search } from '../../../src/index.js';

describe('Slices tests', () => {
  it.each([
    {
      expression: 'bar[0:10]',
      expected: null,
    },
    {
      expression: 'foo[0:10:1]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[0:10]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[0:10:]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[0::1]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[0::]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[0:]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[:10:1]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[::1]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[:10:]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[::]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[:]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[1:9]',
      expected: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    {
      expression: 'foo[0:10:2]',
      expected: [0, 2, 4, 6, 8],
    },
    {
      expression: 'foo[5:]',
      expected: [5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[5::2]',
      expected: [5, 7, 9],
    },
    {
      expression: 'foo[::2]',
      expected: [0, 2, 4, 6, 8],
    },
    {
      expression: 'foo[::-1]',
      expected: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    },
    {
      expression: 'foo[1::2]',
      expected: [1, 3, 5, 7, 9],
    },
    {
      expression: 'foo[10:0:-1]',
      expected: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    },
    {
      expression: 'foo[10:5:-1]',
      expected: [9, 8, 7, 6],
    },
    {
      expression: 'foo[8:2:-2]',
      expected: [8, 6, 4],
    },
    {
      expression: 'foo[0:20]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      expression: 'foo[10:-20:-1]',
      expected: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    },
    {
      expression: 'foo[10:-20]',
      expected: [],
    },
    {
      expression: 'foo[-4:-1]',
      expected: [6, 7, 8],
    },
    {
      expression: 'foo[:-5:-1]',
      expected: [9, 8, 7, 6],
    },
  ])(
    'should support slicing arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        bar: {
          baz: 1,
        },
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo[8:2:0]',
      error: 'Invalid slice, step cannot be 0',
    },
    {
      expression: 'foo[8:2:0:1]',
      error:
        'Invalid jmespath expression: parse error at column 9, found unexpected token ":" (colon) in expression: foo[8:2:0:1]',
    },
    {
      expression: 'foo[8:2&]',
      error:
        'Invalid jmespath expression: parse error at column 7, found unexpected token "&" (expref) in expression: foo[8:2&]',
    },
    {
      expression: 'foo[2:a:3]',
      error:
        'Invalid jmespath expression: parse error at column 6, found unexpected token "a" (unquoted_identifier) in expression: foo[2:a:3]',
    },
  ])(
    'slicing objects with arrays errors: $expression',
    ({ expression, error }) => {
      // Prepare
      const data = {
        type: 'object',
      };

      // Act & Assess
      expect(() => search(expression, data)).toThrow(error);
    }
  );

  it.each([
    {
      expression: 'foo[:2].a',
      expected: [1, 2],
    },
    {
      expression: 'foo[:2].b',
      expected: [],
    },
    {
      expression: 'foo[:2].a.b',
      expected: [],
    },
    {
      expression: 'bar[::-1].a.b',
      expected: [3, 2, 1],
    },
    {
      expression: 'bar[:2].a.b',
      expected: [1, 2],
    },
    {
      expression: 'baz[:2].a',
      expected: null,
    },
  ])(
    'should support slicing an object with nested arrays with objects in them: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [{ a: 1 }, { a: 2 }, { a: 3 }],
        bar: [{ a: { b: 1 } }, { a: { b: 2 } }, { a: { b: 3 } }],
        baz: 50,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: '[:]',
      expected: [{ a: 1 }, { a: 2 }, { a: 3 }],
    },
    {
      expression: '[:2].a',
      expected: [1, 2],
    },
    {
      expression: '[::-1].a',
      expected: [3, 2, 1],
    },
    {
      expression: '[:2].b',
      expected: [],
    },
  ])(
    'should support slicing an array with objects in it: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = [{ a: 1 }, { a: 2 }, { a: 3 }];

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

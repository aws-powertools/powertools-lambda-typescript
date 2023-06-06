/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/filters
 */
import { search } from '../../src';

describe('Filer operator tests', () => {
  it.each([
    {
      comment: 'Matching a literal',
      expression: `foo[?name == 'a']`,
      expected: [{ name: 'a' }],
    },
  ])('should match a literal', ({ expression, expected }) => {
    // Prepare
    const data = { foo: [{ name: 'a' }, { name: 'b' }] };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: '*[?[0] == `0`]',
      expected: [[], []],
    },
  ])('should match a literal in arrays', ({ expression, expected }) => {
    // Prepare
    const data = { foo: [0, 1], bar: [2, 3] };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'foo[?first == last]',
      expected: [{ first: 'foo', last: 'foo' }],
    },
    {
      comment: 'Verify projection created from filter',
      expression: 'foo[?first == last].first',
      expected: ['foo'],
    },
  ])('should match an expression', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: [
        { first: 'foo', last: 'bar' },
        { first: 'foo', last: 'foo' },
        { first: 'foo', last: 'baz' },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      comment: 'Greater than with a number',
      expression: 'foo[?age > `25`]',
      expected: [{ age: 30 }],
    },
    {
      expression: 'foo[?age >= `25`]',
      expected: [{ age: 25 }, { age: 30 }],
    },
    {
      comment: 'Greater than with a number',
      expression: 'foo[?age > `30`]',
      expected: [],
    },
    {
      comment: 'Greater than with a number',
      expression: 'foo[?age < `25`]',
      expected: [{ age: 20 }],
    },
    {
      comment: 'Greater than with a number',
      expression: 'foo[?age <= `25`]',
      expected: [{ age: 20 }, { age: 25 }],
    },
    {
      comment: 'Greater than with a number',
      expression: 'foo[?age < `20`]',
      expected: [],
    },
    {
      expression: 'foo[?age == `20`]',
      expected: [{ age: 20 }],
    },
    {
      expression: 'foo[?age != `20`]',
      expected: [{ age: 25 }, { age: 30 }],
    },
  ])(
    'should match an expression with operators',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: [{ age: 20 }, { age: 25 }, { age: 30 }] };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      comment: 'Greater than with a number',
      expression: 'foo[?weight > `44.4`]',
      expected: [{ weight: 55.5 }],
    },
    {
      expression: 'foo[?weight >= `44.4`]',
      expected: [{ weight: 44.4 }, { weight: 55.5 }],
    },
    {
      comment: 'Greater than with a number',
      expression: 'foo[?weight > `55.5`]',
      expected: [],
    },
    {
      comment: 'Greater than with a number',
      expression: 'foo[?weight < `44.4`]',
      expected: [{ weight: 33.3 }],
    },
    {
      comment: 'Greater than with a number',
      expression: 'foo[?weight <= `44.4`]',
      expected: [{ weight: 33.3 }, { weight: 44.4 }],
    },
    {
      comment: 'Greater than with a number',
      expression: 'foo[?weight < `33.3`]',
      expected: [],
    },
    {
      expression: 'foo[?weight == `33.3`]',
      expected: [{ weight: 33.3 }],
    },
    {
      expression: 'foo[?weight != `33.3`]',
      expected: [{ weight: 44.4 }, { weight: 55.5 }],
    },
  ])(
    'should match an expression with comparisons',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [{ weight: 33.3 }, { weight: 44.4 }, { weight: 55.5 }],
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: `foo[?top.name == 'a']`,
      expected: [{ top: { name: 'a' } }],
    },
  ])('should match with subexpression', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: [
        { first: 'foo', last: 'bar' },
        { first: 'foo', last: 'foo' },
        { first: 'foo', last: 'baz' },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      comment: 'Matching an expression',
      expression: 'foo[?top.first == top.last]',
      expected: [{ top: { first: 'foo', last: 'foo' } }],
    },
    {
      comment: 'Matching a JSON array',
      expression: 'foo[?top == `{"first": "foo", "last": "bar"}`]',
      expected: [{ top: { first: 'foo', last: 'bar' } }],
    },
  ])('should match with arrays', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: [
        { top: { first: 'foo', last: 'bar' } },
        { top: { first: 'foo', last: 'foo' } },
        { top: { first: 'foo', last: 'baz' } },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'foo[?key == `true`]',
      expected: [{ key: true }],
    },
    {
      expression: 'foo[?key == `false`]',
      expected: [{ key: false }],
    },
    {
      expression: 'foo[?key == `0`]',
      expected: [{ key: 0 }],
    },
    {
      expression: 'foo[?key == `1`]',
      expected: [{ key: 1 }],
    },
    {
      expression: 'foo[?key == `[0]`]',
      expected: [{ key: [0] }],
    },
    {
      expression: 'foo[?key == `{"bar": [0]}`]',
      expected: [{ key: { bar: [0] } }],
    },
    {
      expression: 'foo[?key == `null`]',
      expected: [{ key: null }],
    },
    {
      expression: 'foo[?key == `[1]`]',
      expected: [{ key: [1] }],
    },
    {
      expression: 'foo[?key == `{"a":2}`]',
      expected: [{ key: { a: 2 } }],
    },
    {
      expression: 'foo[?`true` == key]',
      expected: [{ key: true }],
    },
    {
      expression: 'foo[?`false` == key]',
      expected: [{ key: false }],
    },
    {
      expression: 'foo[?`0` == key]',
      expected: [{ key: 0 }],
    },
    {
      expression: 'foo[?`1` == key]',
      expected: [{ key: 1 }],
    },
    {
      expression: 'foo[?`[0]` == key]',
      expected: [{ key: [0] }],
    },
    {
      expression: 'foo[?`{"bar": [0]}` == key]',
      expected: [{ key: { bar: [0] } }],
    },
    {
      expression: 'foo[?`null` == key]',
      expected: [{ key: null }],
    },
    {
      expression: 'foo[?`[1]` == key]',
      expected: [{ key: [1] }],
    },
    {
      expression: 'foo[?`{"a":2}` == key]',
      expected: [{ key: { a: 2 } }],
    },
    {
      expression: 'foo[?key != `true`]',
      expected: [
        { key: false },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?key != `false`]',
      expected: [
        { key: true },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?key != `0`]',
      expected: [
        { key: true },
        { key: false },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?key != `1`]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?key != `null`]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?key != `[1]`]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?key != `{"a":2}`]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
      ],
    },
    {
      expression: 'foo[?`true` != key]',
      expected: [
        { key: false },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?`false` != key]',
      expected: [
        { key: true },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?`0` != key]',
      expected: [
        { key: true },
        { key: false },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?`1` != key]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?`null` != key]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?`[1]` != key]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[?`{"a":2}` != key]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: 1 },
        { key: [0] },
        { key: { bar: [0] } },
        { key: null },
        { key: [1] },
      ],
    },
  ])(
    'should match with object that have mixed types as values',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          { key: true },
          { key: false },
          { key: 0 },
          { key: 1 },
          { key: [0] },
          { key: { bar: [0] } },
          { key: null },
          { key: [1] },
          { key: { a: 2 } },
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
      expression: 'foo[?key == `true`]',
      expected: [{ key: true }],
    },
    {
      expression: 'foo[?key == `false`]',
      expected: [{ key: false }],
    },
    {
      expression: 'foo[?key]',
      expected: [
        { key: true },
        { key: 0 },
        { key: 0.0 },
        { key: 1 },
        { key: 1.0 },
        { key: [0] },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[? !key]',
      expected: [{ key: false }, { key: null }, { key: [] }, { key: {} }],
    },
    {
      expression: 'foo[? !!key]',
      expected: [
        { key: true },
        { key: 0 },
        { key: 0.0 },
        { key: 1 },
        { key: 1.0 },
        { key: [0] },
        { key: [1] },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[? `true`]',
      expected: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: 0.0 },
        { key: 1 },
        { key: 1.0 },
        { key: [0] },
        { key: null },
        { key: [1] },
        { key: [] },
        { key: {} },
        { key: { a: 2 } },
      ],
    },
    {
      expression: 'foo[? `false`]',
      expected: [],
    },
  ])('should match with falsy values', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: [
        { key: true },
        { key: false },
        { key: 0 },
        { key: 0.0 },
        { key: 1 },
        { key: 1.0 },
        { key: [0] },
        { key: null },
        { key: [1] },
        { key: [] },
        { key: {} },
        { key: { a: 2 } },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'reservations[].instances[?bar==`1`]',
      expected: [[{ foo: 2, bar: 1 }]],
    },
    {
      expression: 'reservations[*].instances[?bar==`1`]',
      expected: [[{ foo: 2, bar: 1 }]],
    },
    {
      expression: 'reservations[].instances[?bar==`1`][]',
      expected: [{ foo: 2, bar: 1 }],
    },
  ])(
    'should match with nested objects and arrays',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        reservations: [
          {
            instances: [
              { foo: 1, bar: 2 },
              { foo: 1, bar: 3 },
              { foo: 1, bar: 2 },
              { foo: 2, bar: 1 },
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
      expression: 'foo[?bar==`1`].bar[0]',
      expected: [],
    },
  ])(
    'should match with nested objects and arrays with different structures',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        baz: 'other',
        foo: [
          { bar: 1 },
          { bar: 2 },
          { bar: 3 },
          { bar: 4 },
          { bar: 1, baz: 2 },
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
      expression: 'foo[?a==`1`].b.c',
      expected: ['x', 'y', 'z'],
    },
  ])('should support filter in indexes', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: [
        { a: 1, b: { c: 'x' } },
        { a: 1, b: { c: 'y' } },
        { a: 1, b: { c: 'z' } },
        { a: 2, b: { c: 'z' } },
        { a: 1, baz: 2 },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      comment: 'Filter with or expression',
      expression: `foo[?name == 'a' || name == 'b']`,
      expected: [{ name: 'a' }, { name: 'b' }],
    },
    {
      expression: `foo[?name == 'a' || name == 'e']`,
      expected: [{ name: 'a' }],
    },
    {
      expression: `foo[?name == 'a' || name == 'b' || name == 'c']`,
      expected: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    },
  ])(
    'should support filter with or expressions',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      comment: 'Filter with and expression',
      expression: 'foo[?a == `1` && b == `2`]',
      expected: [{ a: 1, b: 2 }],
    },
    {
      expression: 'foo[?a == `1` && b == `4`]',
      expected: [],
    },
  ])('should support filter and expressions', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: [
        { a: 1, b: 2 },
        { a: 1, b: 3 },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      comment: 'Filter with Or and And expressions',
      expression: 'foo[?c == `3` || a == `1` && b == `4`]',
      expected: [{ a: 1, b: 2, c: 3 }],
    },
    {
      expression: 'foo[?b == `2` || a == `3` && b == `4`]',
      expected: [
        { a: 1, b: 2, c: 3 },
        { a: 3, b: 4 },
      ],
    },
    {
      expression: 'foo[?a == `3` && b == `4` || b == `2`]',
      expected: [
        { a: 1, b: 2, c: 3 },
        { a: 3, b: 4 },
      ],
    },
    {
      expression: 'foo[?(a == `3` && b == `4`) || b == `2`]',
      expected: [
        { a: 1, b: 2, c: 3 },
        { a: 3, b: 4 },
      ],
    },
    {
      expression: 'foo[?((a == `3` && b == `4`)) || b == `2`]',
      expected: [
        { a: 1, b: 2, c: 3 },
        { a: 3, b: 4 },
      ],
    },
    {
      expression: 'foo[?a == `3` && (b == `4` || b == `2`)]',
      expected: [{ a: 3, b: 4 }],
    },
    {
      expression: 'foo[?a == `3` && ((b == `4` || b == `2`))]',
      expected: [{ a: 3, b: 4 }],
    },
  ])(
    'should support filter with or & and expressions',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          { a: 1, b: 2, c: 3 },
          { a: 3, b: 4 },
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
      comment: 'Verify precedence of or/and expressions',
      expression: 'foo[?a == `1` || b ==`2` && c == `5`]',
      expected: [{ a: 1, b: 2, c: 3 }],
    },
    {
      comment: 'Parentheses can alter precedence',
      expression: 'foo[?(a == `1` || b ==`2`) && c == `5`]',
      expected: [],
    },
    {
      comment: 'Not expressions combined with and/or',
      expression: 'foo[?!(a == `1` || b ==`2`)]',
      expected: [{ a: 3, b: 4 }],
    },
  ])(
    'should support filter with expressions and respect precedence',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          { a: 1, b: 2, c: 3 },
          { a: 3, b: 4 },
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
      comment: 'Unary filter expression',
      expression: 'foo[?key]',
      expected: [
        { key: true },
        { key: [0] },
        { key: { a: 'b' } },
        { key: 0 },
        { key: 1 },
      ],
    },
    {
      comment: 'Unary not filter expression',
      expression: 'foo[?!key]',
      expected: [
        { key: false },
        { key: [] },
        { key: {} },
        { key: null },
        { notkey: true },
      ],
    },
    {
      comment: 'Equality with null RHS',
      expression: 'foo[?key == `null`]',
      expected: [{ key: null }, { notkey: true }],
    },
  ])('should support unary expressions', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: [
        { key: true },
        { key: false },
        { key: [] },
        { key: {} },
        { key: [0] },
        { key: { a: 'b' } },
        { key: 0 },
        { key: 1 },
        { key: null },
        { notkey: true },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      comment: 'Using @ in a filter expression',
      expression: 'foo[?@ < `5`]',
      expected: [0, 1, 2, 3, 4],
    },
    {
      comment: 'Using @ in a filter expression',
      expression: 'foo[?`5` > @]',
      expected: [0, 1, 2, 3, 4],
    },
    {
      comment: 'Using @ in a filter expression',
      expression: 'foo[?@ == @]',
      expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
  ])('should support using current in a filter', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });
});

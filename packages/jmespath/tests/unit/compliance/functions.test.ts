import { describe, expect, it } from 'vitest';
import { search } from '../../../src/index.js';

describe('Functions tests', () => {
  it.each([
    {
      expression: 'abs(foo)',
      expected: 1,
    },
    {
      expression: 'abs(foo)',
      expected: 1,
    },
    {
      expression: 'abs(array[1])',
      expected: 3,
    },
    {
      expression: 'abs(array[1])',
      expected: 3,
    },
    {
      expression: 'abs(`-24`)',
      expected: 24,
    },
    {
      expression: 'abs(`-24`)',
      expected: 24,
    },
  ])(
    'should support the abs() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'abs(str)',
      error:
        'Invalid argument type for function abs(), expected "number" but found "string" in expression: abs(str)',
    },
    {
      expression: 'abs(`false`)',
      error:
        'Invalid argument type for function abs(), expected "number" but found "boolean" in expression: abs(`false`)',
    },
    {
      expression: 'abs(`1`, `2`)',
      error:
        'Expected at most 1 argument for function abs(), received 2 in expression: abs(`1`, `2`)',
    },
    {
      expression: 'abs()',
      error:
        'Expected at least 1 argument for function abs(), received 0 in expression: abs()',
    },
  ])('abs() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'unknown_function(`1`, `2`)',
      error:
        'Unknown function: unknown_function() in expression: unknown_function(`1`, `2`)',
    },
  ])('unknown function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'avg(numbers)',
      expected: 2.75,
    },
  ])(
    'should support the avg() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'avg(array)',
      error:
        'Invalid argument type for function avg(), expected "number" but found "string" in expression: avg(array)',
    },
    {
      expression: `avg('abc')`,
      error: `Invalid argument type for function avg(), expected "array-number" but found "string" in expression: avg('abc')`,
    },
    {
      expression: 'avg(foo)',
      error:
        'Invalid argument type for function avg(), expected "array-number" but found "number" in expression: avg(foo)',
    },
    {
      expression: 'avg(@)',
      error:
        'Invalid argument type for function avg(), expected "array-number" but found "object" in expression: avg(@)',
    },
    {
      expression: 'avg(strings)',
      error:
        'Invalid argument type for function avg(), expected "number" but found "string" in expression: avg(strings)',
    },
  ])('avg() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'ceil(`1.2`)',
      expected: 2,
    },
    {
      expression: 'ceil(decimals[0])',
      expected: 2,
    },
    {
      expression: 'ceil(decimals[1])',
      expected: 2,
    },
    {
      expression: 'ceil(decimals[2])',
      expected: -1,
    },
  ])(
    'should support the ceil() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: `ceil('string')`,
      error: `Invalid argument type for function ceil(), expected "number" but found "string" in expression: ceil('string')`,
    },
  ])('ceil() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: `contains('abc', 'a')`,
      expected: true,
    },
    {
      expression: `contains('abc', 'd')`,
      expected: false,
    },
    {
      expression: "contains(strings, 'a')",
      expected: true,
    },
    {
      expression: 'contains(decimals, `1.2`)',
      expected: true,
    },
    {
      expression: 'contains(decimals, `false`)',
      expected: false,
    },
  ])(
    'should support the contains() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'contains(`false`, "d")',
      error:
        'Invalid argument type for function contains(), expected one of "array", "string" but found "boolean" in expression: contains(`false`, "d")',
    },
  ])('contains() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: `ends_with(str, 'r')`,
      expected: true,
    },
    {
      expression: `ends_with(str, 'tr')`,
      expected: true,
    },
    {
      expression: `ends_with(str, 'Str')`,
      expected: true,
    },
    {
      expression: `ends_with(str, 'SStr')`,
      expected: false,
    },
    {
      expression: `ends_with(str, 'foo')`,
      expected: false,
    },
  ])(
    'should support the ends_with() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'ends_with(str, `0`)',
      error:
        'Invalid argument type for function ends_with(), expected "string" but found "number" in expression: ends_with(str, `0`)',
    },
  ])('ends_with() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'floor(`1.2`)',
      expected: 1,
    },
    {
      expression: 'floor(decimals[0])',
      expected: 1,
    },
    {
      expression: 'floor(foo)',
      expected: -1,
    },
  ])(
    'should support the floor() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: `floor('string')`,
      error: `Invalid argument type for function floor(), expected "number" but found "string" in expression: floor('string')`,
    },
    {
      expression: 'floor(str)',
      error:
        'Invalid argument type for function floor(), expected "number" but found "string" in expression: floor(str)',
    },
  ])('floor() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: `length('abc')`,
      expected: 3,
    },
    {
      expression: `length('✓foo')`,
      expected: 4,
    },
    {
      expression: `length('')`,
      expected: 0,
    },
    {
      expression: 'length(@)',
      expected: 12,
    },
    {
      expression: 'length(strings[0])',
      expected: 1,
    },
    {
      expression: 'length(str)',
      expected: 3,
    },
    {
      expression: 'length(array)',
      expected: 6,
    },
    {
      expression: 'length(objects)',
      expected: 2,
    },
    {
      expression: 'length(strings[0])',
      expected: 1,
    },
  ])(
    'should support the length() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'length(`false`)',
      error:
        'Invalid argument type for function length(), expected one of "array", "string", "object" but found "boolean" in expression: length(`false`)',
    },
    {
      expression: 'length(foo)',
      error:
        'Invalid argument type for function length(), expected one of "array", "string", "object" but found "number" in expression: length(foo)',
    },
  ])('length() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'max(numbers)',
      expected: 5,
    },
    {
      expression: 'max(decimals)',
      expected: 1.2,
    },
    {
      expression: 'max(strings)',
      expected: 'c',
    },
    {
      expression: 'max(decimals)',
      expected: 1.2,
    },
    {
      expression: 'max(empty_list)',
      expected: null,
    },
  ])(
    'should support the max() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'max(abc)',
      error:
        'Invalid argument type for function max(), expected one of "array-number", "array-string" but found "null" in expression: max(abc)',
    },
    {
      expression: 'max(array)',
      error:
        'Invalid argument type for function max(), expected "number" but found "string" in expression: max(array)',
    },
  ])('max() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'merge(`{}`)',
      expected: {},
    },
    {
      expression: 'merge(`{}`, `{}`)',
      expected: {},
    },
    {
      expression: 'merge(`{"a": 1}`, `{"b": 2}`)',
      expected: {
        a: 1,
        b: 2,
      },
    },
    {
      expression: 'merge(`{"a": 1}`, `{"a": 2}`)',
      expected: {
        a: 2,
      },
    },
    {
      expression: 'merge(`{"a": 1, "b": 2}`, `{"a": 2, "c": 3}`, `{"d": 4}`)',
      expected: {
        a: 2,
        b: 2,
        c: 3,
        d: 4,
      },
    },
  ])(
    'should support the merge() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'min(numbers)',
      expected: -1,
    },
    {
      expression: 'min(decimals)',
      expected: -1.5,
    },
    {
      expression: 'min(empty_list)',
      expected: null,
    },
    {
      expression: 'min(decimals)',
      expected: -1.5,
    },
    {
      expression: 'min(strings)',
      expected: 'a',
    },
  ])(
    'should support the min() function: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'min(abc)',
      error:
        'Invalid argument type for function min(), expected one of "array-number", "array-string" but found "null" in expression: min(abc)',
    },
    {
      expression: 'min(array)',
      error:
        'Invalid argument type for function min(), expected "number" but found "string" in expression: min(array)',
    },
  ])('min() function errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: `type('abc')`,
      expected: 'string',
    },
    {
      expression: 'type(`1.0`)',
      expected: 'number',
    },
    {
      expression: 'type(`2`)',
      expected: 'number',
    },
    {
      expression: 'type(`true`)',
      expected: 'boolean',
    },
    {
      expression: 'type(`false`)',
      expected: 'boolean',
    },
    {
      expression: 'type(`null`)',
      expected: 'null',
    },
    {
      expression: 'type(`[0]`)',
      expected: 'array',
    },
    {
      expression: 'type(`{"a": "b"}`)',
      expected: 'object',
    },
    {
      expression: 'type(@)',
      expected: 'object',
    },
  ])('should support the type() function', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'sort(keys(objects))',
      expected: ['bar', 'foo'],
    },
    {
      expression: 'sort(values(objects))',
      expected: ['bar', 'baz'],
    },
    {
      expression: 'keys(empty_hash)',
      expected: [],
    },
    {
      expression: 'sort(numbers)',
      expected: [-1, 3, 4, 5],
    },
    {
      expression: 'sort(strings)',
      expected: ['a', 'b', 'c'],
    },
    {
      expression: 'sort(decimals)',
      expected: [-1.5, 1.01, 1.2],
    },
    {
      expression: 'sort(empty_list)',
      expected: [],
    },
  ])(
    'should support the sort(), key(), and values() functions',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'keys(foo)',
      error:
        'Invalid argument type for function keys(), expected "object" but found "number" in expression: keys(foo)',
    },
    {
      expression: 'keys(strings)',
      error:
        'Invalid argument type for function keys(), expected "object" but found "array" in expression: keys(strings)',
    },
    {
      expression: 'keys(`false`)',
      error:
        'Invalid argument type for function keys(), expected "object" but found "boolean" in expression: keys(`false`)',
    },
    {
      expression: 'values(foo)',
      error:
        'Invalid argument type for function values(), expected "object" but found "number" in expression: values(foo)',
    },
    {
      expression: 'sort(array)',
      error:
        'Invalid argument type for function sort(), expected "number" but found "string" in expression: sort(array)',
    },
    {
      expression: 'sort(abc)',
      error:
        'Invalid argument type for function sort(), expected one of "array-number", "array-string" but found "null" in expression: sort(abc)',
    },
    {
      expression: 'sort(@)',
      error:
        'Invalid argument type for function sort(), expected one of "array-number", "array-string" but found "object" in expression: sort(@)',
    },
  ])(
    'sort(), keys(), and values() function errors',
    ({ expression, error }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act & Assess
      expect(() => search(expression, data)).toThrow(error);
    }
  );

  it.each([
    {
      expression: `join(', ', strings)`,
      expected: 'a, b, c',
    },
    {
      expression: `join(', ', strings)`,
      expected: 'a, b, c',
    },
    {
      expression: 'join(\',\', `["a", "b"]`)',
      expected: 'a,b',
    },
    {
      expression: `join('|', strings)`,
      expected: 'a|b|c',
    },
    {
      expression: `join('|', decimals[].to_string(@))`,
      expected: '1.01|1.2|-1.5',
    },
    {
      expression: `join('|', empty_list)`,
      expected: '',
    },
  ])('should support the join() function', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'join(\',\', `["a", 0]`)',
      error:
        'Invalid argument type for function join(), expected "string" but found "number" in expression: join(\',\', `["a", 0]`)',
    },
    {
      expression: `join(', ', str)`,
      error: `Invalid argument type for function join(), expected "array-string" but found "string" in expression: join(', ', str)`,
    },
    {
      expression: 'join(`2`, strings)',
      error:
        'Invalid argument type for function join(), expected "string" but found "number" in expression: join(`2`, strings)',
    },
    {
      expression: `join('|', decimals)`,
      error:
        'Invalid argument type for function join(), expected "string" but found "number" in expression: join(\'|\', decimals)',
    },
  ])('join() function errors', ({ expression, error }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'reverse(numbers)',
      expected: [5, 4, 3, -1],
    },
    {
      expression: 'reverse(array)',
      expected: ['100', 'a', 5, 4, 3, -1],
    },
    {
      expression: 'reverse(`[]`)',
      expected: [],
    },
    {
      expression: `reverse('')`,
      expected: '',
    },
    {
      expression: `reverse('hello world')`,
      expected: 'dlrow olleh',
    },
  ])('should support the reverse() function', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: `starts_with(str, 'S')`,
      expected: true,
    },
    {
      expression: `starts_with(str, 'St')`,
      expected: true,
    },
    {
      expression: `starts_with(str, 'Str')`,
      expected: true,
    },
    {
      expression: `starts_with(str, 'String')`,
      expected: false,
    },
  ])(
    'should support the starts_with() function',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: -1,
        zero: 0,
        numbers: [-1, 3, 4, 5],
        array: [-1, 3, 4, 5, 'a', '100'],
        strings: ['a', 'b', 'c'],
        decimals: [1.01, 1.2, -1.5],
        str: 'Str',
        false: false,
        empty_list: [],
        empty_hash: {},
        objects: {
          foo: 'bar',
          bar: 'baz',
        },
        null_key: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'starts_with(str, `0`)',
      error:
        'Invalid argument type for function starts_with(), expected "string" but found "null" in expression: starts_with(str, `0`)',
    },
  ])('starts_with() function errors', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'sum(numbers)',
      expected: 11,
    },
    {
      expression: 'sum(decimals)',
      expected: 0.71,
    },
    {
      expression: 'sum(array[].to_number(@))',
      expected: 111,
    },
    {
      expression: 'sum(`[]`)',
      expected: 0,
    },
  ])('should support the sum() function', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'sum(array)',
      error:
        'Invalid argument type for function sum(), expected "array-number" but found "null" in expression: sum(array)',
    },
  ])('sum() function errors', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: `to_array('foo')`,
      expected: ['foo'],
    },
    {
      expression: 'to_array(`0`)',
      expected: [0],
    },
    {
      expression: 'to_array(objects)',
      expected: [
        {
          foo: 'bar',
          bar: 'baz',
        },
      ],
    },
    {
      expression: 'to_array(`[1, 2, 3]`)',
      expected: [1, 2, 3],
    },
    {
      expression: 'to_array(false)',
      expected: [false],
    },
  ])('should support the to_array() function', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: `to_string('foo')`,
      expected: 'foo',
    },
    {
      expression: 'to_string(`1.2`)',
      expected: '1.2',
    },
    {
      expression: 'to_string(`[0, 1]`)',
      expected: '[0,1]',
    },
    {
      description: 'function projection on single arg function',
      expression: 'numbers[].to_string(@)',
      expected: ['-1', '3', '4', '5'],
    },
  ])('should support the to_string() function', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: `to_number('1.0')`,
      expected: 1.0,
    },
    {
      expression: `to_number('1.1')`,
      expected: 1.1,
    },
    {
      expression: `to_number('4')`,
      expected: 4,
    },
    {
      expression: `to_number('notanumber')`,
      expected: null,
    },
    {
      expression: 'to_number(`false`)',
      expected: null,
    },
    {
      expression: 'to_number(`null`)',
      expected: null,
    },
    {
      expression: 'to_number(`[0]`)',
      expected: null,
    },
    {
      expression: 'to_number(`{"foo": 0}`)',
      expected: null,
    },
    {
      description: 'function projection on single arg function',
      expression: 'array[].to_number(@)',
      expected: [-1, 3, 4, 5, 100],
    },
  ])('should support the to_number() function', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: '"to_string"(`1.0`)',
      error:
        'Invalid jmespath expression: parse error at column 0, quoted identifiers cannot be used as a function name in expression: "to_string"(`1.0`)',
    },
  ])('to_number() function errors', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'not_null(unknown_key, str)',
      expected: 'Str',
    },
    {
      expression: 'not_null(unknown_key, foo.bar, empty_list, str)',
      expected: [],
    },
    {
      expression: 'not_null(unknown_key, null_key, empty_list, str)',
      expected: [],
    },
    {
      expression: 'not_null(all, expressions, are_null)',
      expected: null,
    },
  ])('should support the not_null() function', ({ expression, expected }) => {
    // Prepare
    const data = {
      foo: -1,
      zero: 0,
      numbers: [-1, 3, 4, 5],
      array: [-1, 3, 4, 5, 'a', '100'],
      strings: ['a', 'b', 'c'],
      decimals: [1.01, 1.2, -1.5],
      str: 'Str',
      false: false,
      empty_list: [],
      empty_hash: {},
      objects: {
        foo: 'bar',
        bar: 'baz',
      },
      null_key: null,
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'not_null()',
      error:
        'Expected 1 argument for function not_null(), received 0 in expression: not_null()',
    },
  ])('not_null() function errors', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      description: 'function projection on variadic function',
      expression: 'foo[].not_null(f, e, d, c, b, a)',
      expected: ['b', 'c', 'd', 'e', 'f'],
    },
  ])(
    'should support function projection on variadic function',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          {
            b: 'b',
            a: 'a',
          },
          {
            c: 'c',
            b: 'b',
          },
          {
            d: 'd',
            c: 'c',
          },
          {
            e: 'e',
            d: 'd',
          },
          {
            f: 'f',
            e: 'e',
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
      description: 'sort by field expression',
      expression: 'sort_by(people, &age)',
      expected: [
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
      ],
    },
    {
      expression: 'sort_by(people, &age_str)',
      expected: [
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
      ],
    },
    {
      description: 'sort by function expression',
      expression: 'sort_by(people, &to_number(age_str))',
      expected: [
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
      ],
    },
    {
      description: 'function projection on sort_by function',
      expression: 'sort_by(people, &age)[].name',
      expected: [3, 'a', 'c', 'b', 'd'],
    },

    {
      expression: 'sort_by(people, &age)[].extra',
      expected: ['foo', 'bar'],
    },
    {
      expression: 'sort_by(`[]`, &age)',
      expected: [],
    },
    {
      expression: 'sort_by(people, &name)',
      expected: [
        { age: 10, age_str: '10', bool: true, name: 3 },
        { age: 20, age_str: '20', bool: true, name: 'a', extra: 'foo' },
        { age: 40, age_str: '40', bool: false, name: 'b', extra: 'bar' },
        { age: 30, age_str: '30', bool: true, name: 'c' },
        { age: 50, age_str: '50', bool: false, name: 'd' },
      ],
    },
  ])('should support sorty_by() special cases', ({ expression, expected }) => {
    // Prepare
    const data = {
      people: [
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'sort_by(people, &extra)',
      error:
        'Invalid argument type for function sort_by(), expected "string" but found "null" in expression: sort_by(people, &extra)',
    },
    {
      expression: 'sort_by(people, &bool)',
      error:
        'Invalid argument type for function sort_by(), expected "string" but found "boolean" in expression: sort_by(people, &bool)',
    },
    {
      expression: 'sort_by(people, name)',
      error:
        'Invalid argument type for function sort_by(), expected "expression" but found "null" in expression: sort_by(people, name)',
    },
  ])('sort_by() function special cases errors', ({ expression, error }) => {
    // Prepare
    const data = {
      people: [
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
      ],
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'max_by(people, &age)',
      expected: {
        age: 50,
        age_str: '50',
        bool: false,
        name: 'd',
      },
    },
    {
      expression: 'max_by(people, &age_str)',
      expected: {
        age: 50,
        age_str: '50',
        bool: false,
        name: 'd',
      },
    },
    {
      expression: 'max_by(people, &to_number(age_str))',
      expected: {
        age: 50,
        age_str: '50',
        bool: false,
        name: 'd',
      },
    },
  ])('should support max_by() special cases', ({ expression, expected }) => {
    // Prepare
    const data = {
      people: [
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'max_by(people, &bool)',
      error:
        'Invalid argument type for function max_by(), expected "string" but found "boolean" in expression: max_by(people, &bool)',
    },
    {
      expression: 'max_by(people, &extra)',
      error:
        'Invalid argument type for function max_by(), expected "string" but found "null" in expression: max_by(people, &extra)',
    },
  ])('max_by() function special cases errors', ({ expression, error }) => {
    // Prepare
    const data = {
      people: [
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
      ],
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'min_by(people, &age)',
      expected: {
        age: 10,
        age_str: '10',
        bool: true,
        name: 3,
      },
    },
    {
      expression: 'min_by(people, &age_str)',
      expected: {
        age: 10,
        age_str: '10',
        bool: true,
        name: 3,
      },
    },
    {
      expression: 'min_by(people, &to_number(age_str))',
      expected: {
        age: 10,
        age_str: '10',
        bool: true,
        name: 3,
      },
    },
  ])('should support min_by() special cases', ({ expression, expected }) => {
    // Prepare
    const data = {
      people: [
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'min_by(people, &bool)',
      error:
        'Invalid argument type for function min_by(), expected "string" but found "boolean" in expression: min_by(people, &bool)',
    },
    {
      expression: 'min_by(people, &extra)',
      error:
        'Invalid argument type for function min_by(), expected "string" but found "null" in expression: min_by(people, &extra)',
    },
  ])('min_by() function special cases errors', ({ expression, error }) => {
    // Prepare
    const data = {
      people: [
        {
          age: 20,
          age_str: '20',
          bool: true,
          name: 'a',
          extra: 'foo',
        },
        {
          age: 40,
          age_str: '40',
          bool: false,
          name: 'b',
          extra: 'bar',
        },
        {
          age: 30,
          age_str: '30',
          bool: true,
          name: 'c',
        },
        {
          age: 50,
          age_str: '50',
          bool: false,
          name: 'd',
        },
        {
          age: 10,
          age_str: '10',
          bool: true,
          name: 3,
        },
      ],
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      description: 'stable sort order',
      expression: 'sort_by(people, &age)',
      expected: [
        {
          age: 10,
          order: '1',
        },
        {
          age: 10,
          order: '2',
        },
        {
          age: 10,
          order: '3',
        },
        {
          age: 10,
          order: '4',
        },
        {
          age: 10,
          order: '5',
        },
        {
          age: 10,
          order: '6',
        },
        {
          age: 10,
          order: '7',
        },
        {
          age: 10,
          order: '8',
        },
        {
          age: 10,
          order: '9',
        },
        {
          age: 10,
          order: '10',
        },
        {
          age: 10,
          order: '11',
        },
      ],
    },
  ])('should support stable sort_by() order', ({ expression, expected }) => {
    // Prepare
    const data = {
      people: [
        {
          age: 10,
          order: '1',
        },
        {
          age: 10,
          order: '2',
        },
        {
          age: 10,
          order: '3',
        },
        {
          age: 10,
          order: '4',
        },
        {
          age: 10,
          order: '5',
        },
        {
          age: 10,
          order: '6',
        },
        {
          age: 10,
          order: '7',
        },
        {
          age: 10,
          order: '8',
        },
        {
          age: 10,
          order: '9',
        },
        {
          age: 10,
          order: '10',
        },
        {
          age: 10,
          order: '11',
        },
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'map(&a, people)',
      expected: [10, 10, 10, 10, 10, 10, 10, 10, 10],
    },
    {
      expression: 'map(&c, people)',
      expected: ['z', null, null, 'z', null, null, 'z', null, null],
    },
    {
      expression: 'map(&foo, empty)',
      expected: [],
    },
  ])('should support map() special cases', ({ expression, expected }) => {
    // Prepare
    const data = {
      people: [
        {
          a: 10,
          b: 1,
          c: 'z',
        },
        {
          a: 10,
          b: 2,
          c: null,
        },
        {
          a: 10,
          b: 3,
        },
        {
          a: 10,
          b: 4,
          c: 'z',
        },
        {
          a: 10,
          b: 5,
          c: null,
        },
        {
          a: 10,
          b: 6,
        },
        {
          a: 10,
          b: 7,
          c: 'z',
        },
        {
          a: 10,
          b: 8,
          c: null,
        },
        {
          a: 10,
          b: 9,
        },
      ],
      empty: [],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'map(&a, badkey)',
      error:
        'Invalid argument type for function map(), expected "array" but found "null" in expression: map(&a, badkey)',
    },
  ])('map() function special cases errors', ({ expression, error }) => {
    // Prepare
    const data = {
      people: [
        {
          a: 10,
          b: 1,
          c: 'z',
        },
        {
          a: 10,
          b: 2,
          c: null,
        },
        {
          a: 10,
          b: 3,
        },
        {
          a: 10,
          b: 4,
          c: 'z',
        },
        {
          a: 10,
          b: 5,
          c: null,
        },
        {
          a: 10,
          b: 6,
        },
        {
          a: 10,
          b: 7,
          c: 'z',
        },
        {
          a: 10,
          b: 8,
          c: null,
        },
        {
          a: 10,
          b: 9,
        },
      ],
      empty: [],
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'map(&foo.bar, array)',
      expected: ['yes1', 'yes2', null],
    },
    {
      expression: 'map(&foo1.bar, array)',
      expected: [null, null, 'no'],
    },
    {
      expression: 'map(&foo.bar.baz, array)',
      expected: [null, null, null],
    },
  ])(
    'should support map() with the `&` expression cases',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        array: [
          {
            foo: {
              bar: 'yes1',
            },
          },
          {
            foo: {
              bar: 'yes2',
            },
          },
          {
            foo1: {
              bar: 'no',
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
      expression: 'map(&[], array)',
      expected: [
        [1, 2, 3, 4],
        [5, 6, 7, 8, 9],
      ],
    },
  ])('should support map() with `&` and `[]`', ({ expression, expected }) => {
    // Prepare
    const data = {
      array: [
        [1, 2, 3, [4]],
        [5, 6, 7, [8, 9]],
      ],
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });
});

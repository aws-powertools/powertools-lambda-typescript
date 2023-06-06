/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/pipe
 */
import { search } from '../../src';

describe('Pipe expressions tests', () => {
  it.each([
    {
      expression: 'foo.*.baz | [0]',
      expected: 'subkey',
    },
    {
      expression: 'foo.*.baz | [1]',
      expected: 'subkey',
    },
    {
      expression: 'foo.*.baz | [2]',
      expected: 'subkey',
    },
    {
      expression: 'foo.bar.* | [0]',
      expected: 'subkey',
    },
    {
      expression: 'foo.*.notbaz | [*]',
      expected: [
        ['a', 'b', 'c'],
        ['a', 'b', 'c'],
      ],
    },
    {
      expression: '{"a": foo.bar, "b": foo.other} | *.baz',
      expected: ['subkey', 'subkey'],
    },
  ])(
    'should support piping a multi-level nested object with arrays',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          bar: {
            baz: 'subkey',
          },
          other: {
            baz: 'subkey',
          },
          other2: {
            baz: 'subkey',
          },
          other3: {
            notbaz: ['a', 'b', 'c'],
          },
          other4: {
            notbaz: ['a', 'b', 'c'],
          },
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
      expression: 'foo | bar',
      expected: { baz: 'one' },
    },
    {
      expression: 'foo | bar | baz',
      expected: 'one',
    },
    {
      expression: 'foo|bar| baz',
      expected: 'one',
    },
    {
      expression: 'not_there | [0]',
      expected: null,
    },
    {
      expression: 'not_there | [0]',
      expected: null,
    },
    {
      expression: '[foo.bar, foo.other] | [0]',
      expected: { baz: 'one' },
    },
    {
      expression: '{"a": foo.bar, "b": foo.other} | a',
      expected: { baz: 'one' },
    },
    {
      expression: '{"a": foo.bar, "b": foo.other} | b',
      expected: { baz: 'two' },
    },
    {
      expression: 'foo.bam || foo.bar | baz',
      expected: 'one',
    },
    {
      expression: 'foo | not_there || bar',
      expected: { baz: 'one' },
    },
  ])(
    'should support piping with boolean conditions',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          bar: {
            baz: 'one',
          },
          other: {
            baz: 'two',
          },
          other2: {
            baz: 'three',
          },
          other3: {
            notbaz: ['a', 'b', 'c'],
          },
          other4: {
            notbaz: ['d', 'e', 'f'],
          },
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
      expression: 'foo[*].bar[*] | [0][0]',
      expected: { baz: 'one' },
    },
    {
      expression: '`null`|[@]',
      expected: [null],
    },
  ])(
    'should support piping with wildcard and current operators',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          {
            bar: [
              {
                baz: 'one',
              },
              {
                baz: 'two',
              },
            ],
          },
          {
            bar: [
              {
                baz: 'three',
              },
              {
                baz: 'four',
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
});

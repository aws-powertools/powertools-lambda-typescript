/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/literal
 */
import { search } from '../../src';

describe('Literal expressions tests', () => {
  it.each([
    {
      expression: '`"foo"`',
      expected: 'foo',
    },
    {
      comment: 'Interpret escaped unicode.',
      expression: '`"\\u03a6"`',
      expected: 'Φ',
    },
    {
      expression: '`"✓"`',
      expected: '✓',
    },
    {
      expression: '`[1, 2, 3]`',
      expected: [1, 2, 3],
    },
    {
      expression: '`{"a": "b"}`',
      expected: {
        a: 'b',
      },
    },
    {
      expression: '`true`',
      expected: true,
    },
    {
      expression: '`false`',
      expected: false,
    },
    {
      expression: '`null`',
      expected: null,
    },
    {
      expression: '`0`',
      expected: 0,
    },
    {
      expression: '`1`',
      expected: 1,
    },
    {
      expression: '`2`',
      expected: 2,
    },
    {
      expression: '`3`',
      expected: 3,
    },
    {
      expression: '`4`',
      expected: 4,
    },
    {
      expression: '`5`',
      expected: 5,
    },
    {
      expression: '`6`',
      expected: 6,
    },
    {
      expression: '`7`',
      expected: 7,
    },
    {
      expression: '`8`',
      expected: 8,
    },
    {
      expression: '`9`',
      expected: 9,
    },
    {
      comment: 'Escaping a backtick in quotes',
      expression: '`"foo\\`bar"`',
      expected: 'foo`bar',
    },
    {
      comment: 'Double quote in literal',
      expression: '`"foo\\"bar"`',
      expected: 'foo"bar',
    },
    {
      expression: '`"1\\`"`',
      expected: '1`',
    },
    {
      comment: 'Multiple literal expressions with escapes',
      expression: '`"\\\\"`.{a:`"b"`}',
      expected: {
        a: 'b',
      },
    },
    {
      comment: 'literal . identifier',
      expression: '`{"a": "b"}`.a',
      expected: 'b',
    },
    {
      comment: 'literal . identifier . identifier',
      expression: '`{"a": {"b": "c"}}`.a.b',
      expected: 'c',
    },
    {
      comment: 'literal . identifier bracket-expr',
      expression: '`[0, 1, 2]`[1]',
      expected: 1,
    },
  ])(
    'should support literal expressions: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          {
            name: 'a',
          },
          {
            name: 'b',
          },
        ],
        bar: {
          baz: 'qux',
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
      comment: 'Literal with leading whitespace',
      expression: '`  {"foo": true}`',
      expected: {
        foo: true,
      },
    },
    {
      comment: 'Literal with trailing whitespace',
      expression: '`{"foo": true}   `',
      expected: {
        foo: true,
      },
    },
  ])(
    'should support literals with other special characters: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        type: 'object',
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      comment: 'Literal on RHS of subexpr not allowed',
      expression: 'foo.`"bar"`',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "bar" (literal) in expression: foo.`"bar"`',
    },
  ])('literals errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: `'foo'`,
      expected: 'foo',
    },
    {
      expression: `'  foo  '`,
      expected: '  foo  ',
    },
    {
      expression: `'0'`,
      expected: '0',
    },
    {
      expression: `'newline\n'`,
      expected: 'newline\n',
    },
    {
      expression: `'\n'`,
      expected: '\n',
    },
    {
      expression: `'✓'`,
      expected: '✓',
    },
    {
      expression: `'𝄞'`,
      expected: '𝄞',
    },
    {
      expression: `'  [foo]  '`,
      expected: '  [foo]  ',
    },
    {
      expression: `'[foo]'`,
      expected: '[foo]',
    },
    {
      comment: 'Do not interpret escaped unicode.',
      expression: `'\\u03a6'`,
      expected: '\\u03a6',
    },
    {
      comment: 'Can escape the single quote',
      expression: `'foo\\'bar'`,
      expected: `foo'bar`,
    },
  ])(
    'should support raw string literals: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {};

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

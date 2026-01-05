import { describe, expect, it } from 'vitest';
import { search } from '../../../src/index.js';

// NOSONAR - This file contains JMESPath compliance tests that intentionally use escape sequences
describe('Escape characters tests', () => {
  it.each([
    {
      expression: '"foo.bar"',
      expected: 'dot',
    },
    {
      expression: '"foo bar"',
      expected: 'space',
    },
    {
      expression: '"foo\\nbar"', // NOSONAR - Compliance test requires literal escape sequences
      expected: 'newline',
    },
    {
      expression: '"foo\\"bar"', // NOSONAR - Compliance test requires literal escape sequences
      expected: 'doublequote',
    },
    {
      expression: '"c:\\\\\\\\windows\\\\path"', // NOSONAR - Compliance test requires literal escape sequences
      expected: 'windows',
    },
    {
      expression: '"/unix/path"',
      expected: 'unix',
    },
    {
      expression: '"\\"\\"\\""', // NOSONAR - Compliance test requires literal escape sequences
      expected: 'threequotes',
    },
    {
      expression: '"bar"."baz"',
      expected: 'qux',
    },
  ])('should support escaping characters: $expression', ({
    expression,
    expected,
  }) => {
    // Prepare
    const data = {
      'foo.bar': 'dot',
      'foo bar': 'space',
      'foo\nbar': 'newline',
      'foo"bar': 'doublequote',
      'c:\\\\windows\\path': 'windows', // NOSONAR - Compliance test requires literal escape sequences
      '/unix/path': 'unix',
      '"""': 'threequotes',
      bar: { baz: 'qux' },
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });
});

/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/base
 */
import { search } from '../../../src';

describe('Base tests', () => {
  it.each([
    {
      expression: 'foo',
      expected: { bar: { baz: 'correct' } },
    },
    {
      expression: 'foo.bar',
      expected: { baz: 'correct' },
    },
    {
      expression: 'foo.bar.baz',
      expected: 'correct',
    },
    {
      expression: 'foo\n.\nbar\n.baz',
      expected: 'correct',
    },
    {
      expression: 'foo.bar.baz.bad',
      expected: null,
    },
    {
      expression: 'foo.bar.bad',
      expected: null,
    },
    {
      expression: 'foo.bad',
      expected: null,
    },
    {
      expression: 'bad',
      expected: null,
    },
    {
      expression: 'bad.morebad.morebad',
      expected: null,
    },
  ])(
    'should parse a multi-level nested object: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: { bar: { baz: 'correct' } } };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo',
      expected: { bar: ['one', 'two', 'three'] },
    },
    {
      expression: 'foo.bar',
      expected: ['one', 'two', 'three'],
    },
  ])(
    'should parse multi-level objects with arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: { bar: ['one', 'two', 'three'] } };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'one',
      expected: null,
    },
    {
      expression: 'two',
      expected: null,
    },
    {
      expression: 'three',
      expected: null,
    },
    {
      expression: 'one.two',
      expected: null,
    },
  ])('should parse an array: $expression', ({ expression, expected }) => {
    // Prepare
    const data = ['one', 'two', 'three'];

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'foo."1"',
      expected: ['one', 'two', 'three'],
    },
    {
      expression: 'foo."1"[0]',
      expected: 'one',
    },
    {
      expression: 'foo."-1"',
      expected: 'bar',
    },
  ])(
    'should parse an object with arrays and numeric values as keys: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: { '1': ['one', 'two', 'three'], '-1': 'bar' } };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

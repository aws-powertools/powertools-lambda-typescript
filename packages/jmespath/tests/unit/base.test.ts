import { search } from '../../src';

describe('Base tests', () => {
  it.each([
    { expression: 'foo', expected: { bar: { baz: 'qux' } } },
    { expression: 'foo.bar', expected: { baz: 'qux' } },
    { expression: 'foo.bar.baz', expected: 'qux' },
    { expression: 'foo.bar.baz.qux', expected: undefined },
    { expression: 'qux', expected: undefined },
    { expression: 'qux.quux', expected: undefined },
    { expression: 'qux.quux.quuux', expected: undefined },
    { expression: 'ffoo\n.\nbar\n.baz', expected: 'qux' },
  ])('should parse a multi-level nested object', ({ expression, expected }) => {
    // Prepare
    const data = { foo: { bar: { baz: 'qux' } } };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    { expression: 'foo', expected: { bar: ['a', 'b', 'c'] } },
    { expression: 'foo.bar', expected: ['a', 'b', 'c'] },
    { expression: 'foo.bar.a', expected: undefined },
  ])(
    'should parse multi-level objects with arrays',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: { bar: ['a', 'b', 'c'] } };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    { expression: 'a', expected: undefined },
    { expression: 'b', expected: undefined },
    { expression: 'c', expected: undefined },
    { expression: 'a.b', expected: undefined },
  ])('should parse an array', ({ expression, expected }) => {
    // Prepare
    const data = ['a', 'b', 'c'];

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    { expression: 'foo."1"', expected: ['a', 'b', 'c'] },
    { expression: 'foo."1"[0]', expected: 'a' },
    { expression: 'foo."-1"', expected: 'bar' },
  ])(
    'should parse an object with arrays and numeric values as keys',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: { '1': ['a', 'b', 'c'], '-1': 'bar' } };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

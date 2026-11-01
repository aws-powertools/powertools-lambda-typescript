import { describe, expect, it } from 'vitest';
import { search } from '../../../src/index.js';

describe('Unicode string functions', () => {
  it.each([
    { value: '', length: 0 },
    { value: 'abc', length: 3 },
    { value: '😀', length: 1 },
    { value: 'a😀b', length: 3 },
    { value: '😀𐀀', length: 2 },
    { value: 'e\u0301', length: 2 },
  ])('counts code points in "$value"', ({ value, length }) => {
    // Prepare
    const expression = 'length(@)';

    // Act
    const result = search(expression, value);

    // Assess
    expect(result).toBe(length);
  });

  it.each([
    { value: '', reversed: '' },
    { value: 'abc', reversed: 'cba' },
    { value: '😀', reversed: '😀' },
    { value: 'a😀b', reversed: 'b😀a' },
    { value: '😀𐀀', reversed: '𐀀😀' },
    { value: 'e\u0301', reversed: '\u0301e' },
  ])('reverses code points in "$value"', ({ value, reversed }) => {
    // Prepare
    const expression = 'reverse(@)';

    // Act
    const result = search(expression, value);

    // Assess
    expect(result).toBe(reversed);
  });

  const orderings = [
    ['～', '😀'],
    ['\uE000', '\uFFFF', '𐀀', '😀', '\u{10FFFF}'],
    ['', 'a', 'a😀', 'a😀a', 'a😀b', 'a😁'],
    ['A', 'B', 'a', 'b'],
    ['e\u0301', 'é'],
    ['😀', '😀'],
  ];

  it.each(
    orderings.flatMap((sorted) =>
      [sorted, sorted.toReversed()].flatMap((values) => [
        { expression: 'sort(@)', values, expected: sorted },
        { expression: 'sort_by(@, &@)', values, expected: sorted },
        { expression: 'min(@)', values, expected: sorted[0] },
        { expression: 'min_by(@, &@)', values, expected: sorted[0] },
        { expression: 'max(@)', values, expected: sorted[sorted.length - 1] },
        {
          expression: 'max_by(@, &@)',
          values,
          expected: sorted[sorted.length - 1],
        },
      ])
    )
  )(
    'orders $values by code point in $expression',
    ({ expression, values, expected }) => {
      // Prepare
      const data = [...values];

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
      expect(data).toStrictEqual(values);
    }
  );

  it.each(['sort_by(@, &key)', 'max_by(@, &key)', 'min_by(@, &key)'])(
    'preserves the order of equal Unicode keys in %s',
    (expression) => {
      // Prepare
      const data = [
        { key: '😀', id: 1 },
        { key: '😀', id: 2 },
      ];

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(
        expression.startsWith('sort') ? data : data[0]
      );
    }
  );
});

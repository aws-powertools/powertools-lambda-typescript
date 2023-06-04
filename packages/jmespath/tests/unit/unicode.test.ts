import { search } from '../../src';

describe('Unicode tests', () => {
  it.each([
    {
      expression: 'foo[]."✓"',
      expected: ['✓', '✗'],
    },
  ])(
    'should parse an object with unicode chars as keys and values',
    ({ expression, expected }) => {
      // Prepare
      const data = { foo: [{ '✓': '✓' }, { '✓': '✗' }] };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: '☯',
      expected: true,
    },
    {
      expression: '☃',
      expected: undefined,
    },
  ])(
    'should parse an object with unicode chars as keys',
    ({ expression, expected }) => {
      // Prepare
      const data = { '☯': true };

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
    {
      expression: '♪♫•*¨*•.¸¸❤¸¸.•*¨*•♫♪',
      expected: true,
    },
  ])(
    'should parse an object with mulitple unicode chars as keys',
    ({ expression, expected }) => {
      // Prepare
      const data = { '♪♫•*¨*•.¸¸❤¸¸.•*¨*•♫♪': true };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

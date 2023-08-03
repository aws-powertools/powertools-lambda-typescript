/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/unicode
 */
import { search } from '../../src';

describe('Unicode tests', () => {
  it.each([
    {
      expression: 'foo[]."✓"',
      expected: ['✓', '✗'],
    },
  ])(
    'should parse an object with unicode chars as keys and values: $expression',
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
      expression: '"☯"',
      expected: true,
    },
    {
      expression: '"☃"',
      expected: null,
    },
  ])(
    'should parse an object with unicode chars as keys: $expression',
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
    {
      expression: '"♪♫•*¨*•.¸¸❤¸¸.•*¨*•♫♪"',
      expected: true,
    },
  ])(
    'should parse an object with mulitple unicode chars as keys: $expression',
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

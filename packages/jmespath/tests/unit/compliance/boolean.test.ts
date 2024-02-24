/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/boolean
 */
import { search } from '../../../src';

describe('Boolean tests', () => {
  it.each([
    {
      expression: 'outer.foo || outer.bar',
      expected: 'foo',
    },
    {
      expression: 'outer.foo||outer.bar',
      expected: 'foo',
    },
    {
      expression: 'outer.bar || outer.baz',
      expected: 'bar',
    },
    {
      expression: 'outer.bar||outer.baz',
      expected: 'bar',
    },
    {
      expression: 'outer.bad || outer.foo',
      expected: 'foo',
    },
    {
      expression: 'outer.bad||outer.foo',
      expected: 'foo',
    },
    {
      expression: 'outer.foo || outer.bad',
      expected: 'foo',
    },
    {
      expression: 'outer.foo||outer.bad',
      expected: 'foo',
    },
    {
      expression: 'outer.bad || outer.alsobad',
      expected: null,
    },
    {
      expression: 'outer.bad||outer.alsobad',
      expected: null,
    },
  ])(
    'should support boolean OR comparison: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        outer: {
          foo: 'foo',
          bar: 'bar',
          baz: 'baz',
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
      expression: 'outer.empty_string || outer.foo',
      expected: 'foo',
    },
    {
      expression:
        'outer.nokey || outer.bool || outer.empty_list || outer.empty_string || outer.foo',
      expected: 'foo',
    },
  ])(
    'should support multiple boolean OR comparisons: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        outer: {
          foo: 'foo',
          bool: false,
          empty_list: [],
          empty_string: '',
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
      expression: 'True && False',
      expected: false,
    },
    {
      expression: 'False && True',
      expected: false,
    },
    {
      expression: 'True && True',
      expected: true,
    },
    {
      expression: 'False && False',
      expected: false,
    },
    {
      expression: 'True && Number',
      expected: 5,
    },
    {
      expression: 'Number && True',
      expected: true,
    },
    {
      expression: 'Number && False',
      expected: false,
    },
    {
      expression: 'Number && EmptyList',
      expected: [],
    },
    {
      expression: 'Number && True',
      expected: true,
    },
    {
      expression: 'EmptyList && True',
      expected: [],
    },
    {
      expression: 'EmptyList && False',
      expected: [],
    },
    {
      expression: 'True || False',
      expected: true,
    },
    {
      expression: 'True || True',
      expected: true,
    },
    {
      expression: 'False || True',
      expected: true,
    },
    {
      expression: 'False || False',
      expected: false,
    },
    {
      expression: 'Number || EmptyList',
      expected: 5,
    },
    {
      expression: 'Number || True',
      expected: 5,
    },
    {
      expression: 'Number || True && False',
      expected: 5,
    },
    {
      expression: '(Number || True) && False',
      expected: false,
    },
    {
      expression: 'Number || (True && False)',
      expected: 5,
    },
    {
      expression: '!True',
      expected: false,
    },
    {
      expression: '!False',
      expected: true,
    },
    {
      expression: '!Number',
      expected: false,
    },
    {
      expression: '!EmptyList',
      expected: true,
    },
    {
      expression: 'True && !False',
      expected: true,
    },
    {
      expression: 'True && !EmptyList',
      expected: true,
    },
    {
      expression: '!False && !EmptyList',
      expected: true,
    },
    {
      expression: '!(True && False)',
      expected: true,
    },
    {
      expression: '!Zero',
      expected: false,
    },
    {
      expression: '!!Zero',
      expected: true,
    },
  ])(
    'should support boolean AND comparison: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        True: true,
        False: false,
        Number: 5,
        EmptyList: [],
        Zero: 0,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'one < two',
      expected: true,
    },
    {
      expression: 'one <= two',
      expected: true,
    },
    {
      expression: 'one == one',
      expected: true,
    },
    {
      expression: 'one == two',
      expected: false,
    },
    {
      expression: 'one > two',
      expected: false,
    },
    {
      expression: 'one >= two',
      expected: false,
    },
    {
      expression: 'one != two',
      expected: true,
    },
    {
      expression: 'one < two && three > one',
      expected: true,
    },
    {
      expression: 'one < two || three > one',
      expected: true,
    },
    {
      expression: 'one < two || three < one',
      expected: true,
    },
    {
      expression: 'two < one || three < one',
      expected: false,
    },
  ])(
    'should support lesser and equal comparison: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        one: 1,
        two: 2,
        three: 3,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

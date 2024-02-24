/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/wildcard
 */
import { search } from '../../../src';

describe('Wildcard tests', () => {
  it.each([
    {
      expression: 'foo.*.baz',
      expected: ['val', 'val', 'val'],
    },
    {
      expression: 'foo.bar.*',
      expected: ['val'],
    },
    {
      expression: 'foo.*.notbaz',
      expected: [
        ['a', 'b', 'c'],
        ['a', 'b', 'c'],
      ],
    },
    {
      expression: 'foo.*.notbaz[0]',
      expected: ['a', 'a'],
    },
    {
      expression: 'foo.*.notbaz[-1]',
      expected: ['c', 'c'],
    },
  ])(
    'should parse the wildcard operator with an object containing multiple keys at different levels: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          bar: {
            baz: 'val',
          },
          other: {
            baz: 'val',
          },
          other2: {
            baz: 'val',
          },
          other3: {
            notbaz: ['a', 'b', 'c'],
          },
          other4: {
            notbaz: ['a', 'b', 'c'],
          },
          other5: {
            other: {
              a: 1,
              b: 1,
              c: 1,
            },
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
      expression: 'foo.*',
      expected: [
        { 'second-1': 'val' },
        { 'second-1': 'val' },
        { 'second-1': 'val' },
      ],
    },
    {
      expression: 'foo.*.*',
      expected: [['val'], ['val'], ['val']],
    },
    {
      expression: 'foo.*.*.*',
      expected: [[], [], []],
    },
    {
      expression: 'foo.*.*.*.*',
      expected: [[], [], []],
    },
  ])(
    'should parse the wildcard operator with an object containing keys with hyphens: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          'first-1': {
            'second-1': 'val',
          },
          'first-2': {
            'second-1': 'val',
          },
          'first-3': {
            'second-1': 'val',
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
      expression: '*.bar',
      expected: ['one', 'one'],
    },
  ])(
    'should parse the wildcard operator with an object containing multiple keys: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          bar: 'one',
        },
        other: {
          bar: 'one',
        },
        nomatch: {
          notbar: 'three',
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
      expression: '*',
      expected: [{ sub1: { foo: 'one' } }, { sub1: { foo: 'one' } }],
    },
    {
      expression: '*.sub1',
      expected: [{ foo: 'one' }, { foo: 'one' }],
    },
    {
      expression: '*.*',
      expected: [[{ foo: 'one' }], [{ foo: 'one' }]],
    },
    {
      expression: '*.*.foo[]',
      expected: ['one', 'one'],
    },
    {
      expression: '*.sub1.foo',
      expected: ['one', 'one'],
    },
  ])(
    'should parse the wildcard operator with an object containing nested objects: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        top1: {
          sub1: { foo: 'one' },
        },
        top2: {
          sub1: { foo: 'one' },
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
      expression: 'foo[*].bar',
      expected: ['one', 'two', 'three'],
    },
    {
      expression: 'foo[*].notbar',
      expected: ['four'],
    },
  ])(
    'should parse the wildcard operator with an object containing an array of objects: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          { bar: 'one' },
          { bar: 'two' },
          { bar: 'three' },
          { notbar: 'four' },
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
      expression: '[*]',
      expected: [
        { bar: 'one' },
        { bar: 'two' },
        { bar: 'three' },
        { notbar: 'four' },
      ],
    },
    {
      expression: '[*].bar',
      expected: ['one', 'two', 'three'],
    },
    {
      expression: '[*].notbar',
      expected: ['four'],
    },
  ])(
    'should parse the wildcard operator with an array of objects: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = [
        { bar: 'one' },
        { bar: 'two' },
        { bar: 'three' },
        { notbar: 'four' },
      ];

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo.bar[*].baz',
      expected: [
        ['one', 'two', 'three'],
        ['four', 'five', 'six'],
        ['seven', 'eight', 'nine'],
      ],
    },
    {
      expression: 'foo.bar[*].baz[0]',
      expected: ['one', 'four', 'seven'],
    },
    {
      expression: 'foo.bar[*].baz[1]',
      expected: ['two', 'five', 'eight'],
    },
    {
      expression: 'foo.bar[*].baz[2]',
      expected: ['three', 'six', 'nine'],
    },
    {
      expression: 'foo.bar[*].baz[3]',
      expected: [],
    },
  ])(
    'should parse the wildcard operator with an object with nested objects containing arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          bar: [
            { baz: ['one', 'two', 'three'] },
            { baz: ['four', 'five', 'six'] },
            { baz: ['seven', 'eight', 'nine'] },
          ],
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
      expression: 'foo.bar[*]',
      expected: [
        ['one', 'two'],
        ['three', 'four'],
      ],
    },
    {
      expression: 'foo.bar[0]',
      expected: ['one', 'two'],
    },
    {
      expression: 'foo.bar[0][0]',
      expected: 'one',
    },
    {
      expression: 'foo.bar[0][0][0]',
      expected: null,
    },
    {
      expression: 'foo.bar[0][0][0][0]',
      expected: null,
    },
    {
      expression: 'foo[0][0]',
      expected: null,
    },
  ])(
    'should parse the wildcard operator with an object with nested arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          bar: [
            ['one', 'two'],
            ['three', 'four'],
          ],
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
      expression: 'foo[*].bar[*].kind',
      expected: [
        ['basic', 'intermediate'],
        ['advanced', 'expert'],
      ],
    },
    {
      expression: 'foo[*].bar[0].kind',
      expected: ['basic', 'advanced'],
    },
  ])(
    'should parse the wildcard operator with an array of objects with nested arrays or strings: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          { bar: [{ kind: 'basic' }, { kind: 'intermediate' }] },
          { bar: [{ kind: 'advanced' }, { kind: 'expert' }] },
          { bar: 'string' },
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
      expression: 'foo[*].bar.kind',
      expected: ['basic', 'intermediate', 'advanced', 'expert'],
    },
  ])(
    'should parse the wildcard operator with an array of objects: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          { bar: { kind: 'basic' } },
          { bar: { kind: 'intermediate' } },
          { bar: { kind: 'advanced' } },
          { bar: { kind: 'expert' } },
          { bar: 'string' },
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
      expression: 'foo[*].bar[0]',
      expected: ['one', 'three', 'five'],
    },
    {
      expression: 'foo[*].bar[1]',
      expected: ['two', 'four'],
    },
    {
      expression: 'foo[*].bar[2]',
      expected: [],
    },
  ])(
    'should parse the wildcard operator with an array of objects with arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          { bar: ['one', 'two'] },
          { bar: ['three', 'four'] },
          { bar: ['five'] },
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
      expression: 'foo[*].bar[0]',
      expected: [],
    },
  ])(
    'should parse the wildcard operator with an array of objects with empty arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [{ bar: [] }, { bar: [] }, { bar: [] }],
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo[*][0]',
      expected: ['one', 'three', 'five'],
    },
    {
      expression: 'foo[*][1]',
      expected: ['two', 'four'],
    },
  ])(
    'should parse the wildcard operator with an array of arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [['one', 'two'], ['three', 'four'], ['five']],
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo[*][0]',
      expected: [['one', 'two'], ['five', 'six'], ['nine']],
    },
    {
      expression: 'foo[*][1]',
      expected: [['three', 'four'], ['seven', 'eight'], ['ten']],
    },
    {
      expression: 'foo[*][0][0]',
      expected: ['one', 'five', 'nine'],
    },
    {
      expression: 'foo[*][1][0]',
      expected: ['three', 'seven', 'ten'],
    },
    {
      expression: 'foo[*][0][1]',
      expected: ['two', 'six'],
    },
    {
      expression: 'foo[*][1][1]',
      expected: ['four', 'eight'],
    },
    {
      expression: 'foo[*][2]',
      expected: [],
    },
    {
      expression: 'foo[*][2][2]',
      expected: [],
    },
    {
      expression: 'bar[*]',
      expected: null,
    },
    {
      expression: 'bar[*].baz[*]',
      expected: null,
    },
  ])(
    'should parse a nested array of arrays: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          [
            ['one', 'two'],
            ['three', 'four'],
          ],
          [
            ['five', 'six'],
            ['seven', 'eight'],
          ],
          [['nine'], ['ten']],
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
      expression: 'string[*]',
      expected: null,
    },
    {
      expression: 'hash[*]',
      expected: null,
    },
    {
      expression: 'number[*]',
      expected: null,
    },
    {
      expression: 'nullvalue[*]',
      expected: null,
    },
    {
      expression: 'string[*].foo',
      expected: null,
    },
    {
      expression: 'hash[*].foo',
      expected: null,
    },
    {
      expression: 'number[*].foo',
      expected: null,
    },
    {
      expression: 'nullvalue[*].foo',
      expected: null,
    },
    {
      expression: 'nullvalue[*].foo[*].bar',
      expected: null,
    },
  ])(
    'should parse an object with different value types: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        string: 'string',
        hash: { foo: 'bar', bar: 'baz' },
        number: 23,
        nullvalue: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'string.*',
      expected: null,
    },
    {
      expression: 'hash.*',
      expected: ['val', 'val'],
    },
    {
      expression: 'number.*',
      expected: null,
    },
    {
      expression: 'array.*',
      expected: null,
    },
    {
      expression: 'nullvalue.*',
      expected: null,
    },
  ])(
    'should parse an object with different value types: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        string: 'string',
        hash: { foo: 'val', bar: 'val' },
        number: 23,
        array: [1, 2, 3],
        nullvalue: null,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
  it.each([{ expression: '*[0]', expected: [0, 0] }])(
    'should get the first element of each array: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        a: [0, 1, 2],
        b: [0, 1, 2],
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

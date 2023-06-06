/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/multiselect
 */
import { search } from '../../src';

describe('Multiselect expressions tests', () => {
  it.each([
    {
      expression: 'foo.{bar: bar}',
      expected: { bar: 'bar' },
    },
    {
      expression: 'foo.{"bar": bar}',
      expected: { bar: 'bar' },
    },
    {
      expression: 'foo.{"foo.bar": bar}',
      expected: { 'foo.bar': 'bar' },
    },
    {
      expression: 'foo.{bar: bar, baz: baz}',
      expected: { bar: 'bar', baz: 'baz' },
    },
    {
      expression: 'foo.{"bar": bar, "baz": baz}',
      expected: { bar: 'bar', baz: 'baz' },
    },
    {
      expression: '{"baz": baz, "qux\\"": "qux\\""}',
      expected: { baz: 2, 'qux"': 3 },
    },
    {
      expression: 'foo.{bar:bar,baz:baz}',
      expected: { bar: 'bar', baz: 'baz' },
    },
    {
      expression: 'foo.{bar: bar,qux: qux}',
      expected: { bar: 'bar', qux: 'qux' },
    },
    {
      expression: 'foo.{bar: bar, noexist: noexist}',
      expected: { bar: 'bar', noexist: null },
    },
    {
      expression: 'foo.{noexist: noexist, alsonoexist: alsonoexist}',
      expected: { noexist: null, alsonoexist: null },
    },
    {
      expression: 'foo.badkey.{nokey: nokey, alsonokey: alsonokey}',
      expected: null,
    },
    {
      expression: 'foo.nested.*.{a: a,b: b}',
      expected: [
        { a: 'first', b: 'second' },
        { a: 'first', b: 'second' },
        { a: 'first', b: 'second' },
      ],
    },
    {
      expression: 'foo.nested.three.{a: a, cinner: c.inner}',
      expected: { a: 'first', cinner: 'third' },
    },
    {
      expression: 'foo.nested.three.{a: a, c: c.inner.bad.key}',
      expected: { a: 'first', c: null },
    },
    {
      expression: 'foo.{a: nested.one.a, b: nested.two.b}',
      expected: { a: 'first', b: 'second' },
    },
    {
      expression: '{bar: bar, baz: baz}',
      expected: { bar: 1, baz: 2 },
    },
    {
      expression: '{bar: bar}',
      expected: { bar: 1 },
    },
    {
      expression: '{otherkey: bar}',
      expected: { otherkey: 1 },
    },
    {
      expression: '{no: no, exist: exist}',
      expected: { no: null, exist: null },
    },
    {
      expression: 'foo.[bar]',
      expected: ['bar'],
    },
    {
      expression: 'foo.[bar,baz]',
      expected: ['bar', 'baz'],
    },
    {
      expression: 'foo.[bar,qux]',
      expected: ['bar', 'qux'],
    },
    {
      expression: 'foo.[bar,noexist]',
      expected: ['bar', null],
    },
    {
      expression: 'foo.[noexist,alsonoexist]',
      expected: [null, null],
    },
  ])(
    'should support expression on large nested objects',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          bar: 'bar',
          baz: 'baz',
          qux: 'qux',
          nested: {
            one: {
              a: 'first',
              b: 'second',
              c: 'third',
            },
            two: {
              a: 'first',
              b: 'second',
              c: 'third',
            },
            three: {
              a: 'first',
              b: 'second',
              c: { inner: 'third' },
            },
          },
        },
        bar: 1,
        baz: 2,
        'qux"': 3,
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo.{bar:bar,baz:baz}',
      expected: { bar: 1, baz: [2, 3, 4] },
    },
    {
      expression: 'foo.[bar,baz[0]]',
      expected: [1, 2],
    },
    {
      expression: 'foo.[bar,baz[1]]',
      expected: [1, 3],
    },
    {
      expression: 'foo.[bar,baz[2]]',
      expected: [1, 4],
    },
    {
      expression: 'foo.[bar,baz[3]]',
      expected: [1, null],
    },
    {
      expression: 'foo.[bar[0],baz[3]]',
      expected: [null, null],
    },
  ])(
    'should support the expression on objects containing arrays',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: { bar: 1, baz: [2, 3, 4] },
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo.{bar: bar, baz: baz}',
      expected: { bar: 1, baz: 2 },
    },
    {
      expression: 'foo.[bar,baz]',
      expected: [1, 2],
    },
  ])(
    'should support the expression using both array and object syntax',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: { bar: 1, baz: 2 },
      };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      expression: 'foo.{bar: bar.baz[1],includeme: includeme}',
      expected: { bar: { common: 'second', two: 2 }, includeme: true },
    },
    {
      expression: 'foo.{"bar.baz.two": bar.baz[1].two, includeme: includeme}',
      expected: { 'bar.baz.two': 2, includeme: true },
    },
    {
      expression: 'foo.[includeme, bar.baz[*].common]',
      expected: [true, ['first', 'second']],
    },
    {
      expression: 'foo.[includeme, bar.baz[*].none]',
      expected: [true, []],
    },
    {
      expression: 'foo.[includeme, bar.baz[].common]',
      expected: [true, ['first', 'second']],
    },
  ])(
    'should support the expression using mixed array and object syntax',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          bar: {
            baz: [
              { common: 'first', one: 1 },
              { common: 'second', two: 2 },
            ],
          },
          ignoreme: 1,
          includeme: true,
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
      expression: 'reservations[*].instances[*].{id: id, name: name}',
      expected: [
        [
          { id: 'id1', name: 'first' },
          { id: 'id2', name: 'second' },
        ],
        [
          { id: 'id3', name: 'third' },
          { id: 'id4', name: 'fourth' },
        ],
      ],
    },
    {
      expression: 'reservations[].instances[].{id: id, name: name}',
      expected: [
        { id: 'id1', name: 'first' },
        { id: 'id2', name: 'second' },
        { id: 'id3', name: 'third' },
        { id: 'id4', name: 'fourth' },
      ],
    },
    {
      expression: 'reservations[].instances[].[id, name]',
      expected: [
        ['id1', 'first'],
        ['id2', 'second'],
        ['id3', 'third'],
        ['id4', 'fourth'],
      ],
    },
  ])(
    'should support the expression with wildcards',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        reservations: [
          {
            instances: [
              { id: 'id1', name: 'first' },
              { id: 'id2', name: 'second' },
            ],
          },
          {
            instances: [
              { id: 'id3', name: 'third' },
              { id: 'id4', name: 'fourth' },
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

  it.each([
    {
      expression: 'foo',
      expected: [
        {
          bar: [
            { qux: 2, baz: 1 },
            { qux: 4, baz: 3 },
          ],
        },
        {
          bar: [
            { qux: 6, baz: 5 },
            { qux: 8, baz: 7 },
          ],
        },
      ],
    },
    {
      expression: 'foo[]',
      expected: [
        {
          bar: [
            { qux: 2, baz: 1 },
            { qux: 4, baz: 3 },
          ],
        },
        {
          bar: [
            { qux: 6, baz: 5 },
            { qux: 8, baz: 7 },
          ],
        },
      ],
    },
    {
      expression: 'foo[].bar',
      expected: [
        [
          { qux: 2, baz: 1 },
          { qux: 4, baz: 3 },
        ],
        [
          { qux: 6, baz: 5 },
          { qux: 8, baz: 7 },
        ],
      ],
    },
    {
      expression: 'foo[].bar[]',
      expected: [
        { qux: 2, baz: 1 },
        { qux: 4, baz: 3 },
        { qux: 6, baz: 5 },
        { qux: 8, baz: 7 },
      ],
    },
    {
      expression: 'foo[].bar[].[baz, qux]',
      expected: [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
      ],
    },
    {
      expression: 'foo[].bar[].[baz]',
      expected: [[1], [3], [5], [7]],
    },
    {
      expression: 'foo[].bar[].[baz, qux][]',
      expected: [1, 2, 3, 4, 5, 6, 7, 8],
    },
  ])(
    'should support expression with the flatten operator',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: [
          {
            bar: [
              {
                qux: 2,
                baz: 1,
              },
              {
                qux: 4,
                baz: 3,
              },
            ],
          },
          {
            bar: [
              {
                qux: 6,
                baz: 5,
              },
              {
                qux: 8,
                baz: 7,
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

  it.each([
    {
      expression: 'foo.[baz[*].bar, qux[0]]',
      expected: [['abc', 'def'], 'zero'],
    },
  ])(
    'should support the expression with slicing',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          baz: [
            {
              bar: 'abc',
            },
            {
              bar: 'def',
            },
          ],
          qux: ['zero'],
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
      expression: 'foo.[baz[*].[bar, boo], qux[0]]',
      expected: [
        [
          ['a', 'c'],
          ['d', 'f'],
        ],
        'zero',
      ],
    },
  ])(
    'should support the expression with wildcard slicing',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          baz: [
            {
              bar: 'a',
              bam: 'b',
              boo: 'c',
            },
            {
              bar: 'd',
              bam: 'e',
              boo: 'f',
            },
          ],
          qux: ['zero'],
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
      expression: 'foo.[baz[*].not_there || baz[*].bar, qux[0]]',
      expected: [['a', 'd'], 'zero'],
    },
  ])(
    'should support multiselect with inexistent values',
    ({ expression, expected }) => {
      // Prepare
      const data = {
        foo: {
          baz: [
            {
              bar: 'a',
              bam: 'b',
              boo: 'c',
            },
            {
              bar: 'd',
              bam: 'e',
              boo: 'f',
            },
          ],
          qux: ['zero'],
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
      comment: 'Nested multiselect',
      expression: '[[*],*]',
      expected: [null, ['object']],
    },
  ])('should support nested multiselect', ({ expression, expected }) => {
    // Prepare
    const data = { type: 'object' };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: '[[*]]',
      expected: [[]],
    },
  ])(
    'should handle nested multiselect with empty arrays',
    ({ expression, expected }) => {
      // Prepare
      const data: string[] = [];

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );
});

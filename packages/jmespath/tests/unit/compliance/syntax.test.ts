import { describe, expect, it } from 'vitest';
import { search } from '../../../src/index.js';

describe('Syntax tests', () => {
  it.each([
    {
      expression: 'foo.bar',
      expected: null,
    },
    {
      expression: 'foo',
      expected: null,
    },
  ])('should support dot syntax: $expression', ({ expression, expected }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: 'foo.1',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "1" (number) in expression: foo.1',
    },
    {
      expression: 'foo.-11',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "-11" (number) in expression: foo.-11',
    },
    {
      expression: 'foo.',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected end of expression (EOF) in expression: foo.',
    },
    {
      expression: '.foo',
      error:
        'Invalid jmespath expression: parse error at column 0, found unexpected token "." (dot) in expression: .foo',
    },
    {
      expression: 'foo..bar',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "." (dot) in expression: foo..bar',
    },
    {
      expression: 'foo.bar.',
      error:
        'Invalid jmespath expression: parse error at column 8, found unexpected end of expression (EOF) in expression: foo.',
    },
    {
      expression: 'foo[.]',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "." (dot) in expression: foo[.]',
    },
  ])('dot syntax errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: '.',
      error:
        'Invalid jmespath expression: parse error at column 0, found unexpected token "." (dot) in expression: .',
    },
    {
      expression: ':',
      error:
        'Invalid jmespath expression: parse error at column 0, found unexpected token ":" (colon) in expression: :',
    },
    {
      expression: ',',
      error:
        'Invalid jmespath expression: parse error at column 0, found unexpected token "," (comma) in expression: ,',
    },
    {
      expression: ']',
      error:
        'Invalid jmespath expression: parse error at column 0, found unexpected token "]" (rbracket) in expression: ]',
    },
    {
      expression: '[',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected end of expression (EOF) in expression: [',
    },
    {
      expression: '}',
      error:
        'Invalid jmespath expression: parse error at column 0, found unexpected token "}" (rbrace) in expression: }',
    },
    {
      expression: '{',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected end of expression (EOF) in expression: {',
    },
    {
      expression: ')',
      error:
        'Invalid jmespath expression: parse error at column 0, found unexpected token ")" (rparen) in expression: )',
    },
    {
      expression: '(',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected end of expression (EOF) in expression: (',
    },
    {
      expression: '((&',
      error:
        'Invalid jmespath expression: parse error at column 3, found unexpected end of expression (EOF) in expression: ((&',
    },
    {
      expression: 'a[',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected end of expression (EOF) in expression: a[',
    },
    {
      expression: 'a]',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected token "]" (rbracket) in expression: a]',
    },
    {
      expression: 'a][',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected token "]" (rbracket) in expression: a]',
    },
    {
      expression: '!',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected end of expression (EOF) in expression: !',
    },
  ])('simple token errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: '![!(!',
      error:
        'Invalid jmespath expression: parse error at column 5, found unexpected end of expression (EOF) in expression: ![!(!',
    },
  ])('boolean token errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: '*',
      expected: ['object'],
    },
    {
      expression: '*.*',
      expected: [],
    },
    {
      expression: '*.foo',
      expected: [],
    },
    {
      expression: '*[0]',
      expected: [],
    },
  ])(
    'should support wildcard syntax: $expression',
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
      expression: '.*',
      error:
        'Invalid jmespath expression: parse error at column 0, found unexpected token "." (dot) in expression: .*',
    },
    {
      expression: '*foo',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected token "foo" (unquoted_identifier) in expression: *foo',
    },
    {
      expression: '*0',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected token "0" (number) in expression: *0',
    },
    {
      expression: 'foo[*]bar',
      error:
        'Invalid jmespath expression: parse error at column 6, found unexpected token "bar" (unquoted_identifier) in expression: foo[*]bar',
    },
    {
      expression: 'foo[*]*',
      error:
        'Invalid jmespath expression: parse error at column 6, found unexpected token "*" (star) in expression: foo[*]*',
    },
  ])('wildcard token errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: '[]',
      expected: null,
    },
  ])(
    'should support flatten syntax: $expression',
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
      expression: '[0]',
      expected: null,
    },
    {
      expression: '[*]',
      expected: null,
    },
    {
      expression: '*.["0"]',
      expected: [[null]],
    },
    {
      expression: '[*].bar',
      expected: null,
    },
    {
      expression: '[*][0]',
      expected: null,
    },
  ])('simple bracket syntax: $expression', ({ expression, expected }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: '*.[0]',
      error:
        'Invalid jmespath expression: parse error at column 3, found unexpected token "0" (number) in expression: *.[0]',
    },
    {
      expression: 'foo[#]',
      error:
        'Bad jmespath expression: unknown token "#" at column 4 in expression: foo[#]',
    },
  ])('simple breacket errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'foo[0]',
      expected: null,
    },
    {
      expression: 'foo.[*]',
      expected: null,
    },
    {
      comment: 'Valid multi-select of a hash using an identifier index',
      expression: 'foo.[abc]',
      expected: null,
    },
    {
      comment: 'Valid multi-select of a hash',
      expression: 'foo.[abc, def]',
      expected: null,
    },
  ])(
    'should support multi-select list syntax: $expression',
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
      comment: 'Valid multi-select of a list',
      expression: 'foo[0, 1]',
      error:
        'Invalid jmespath expression: parse error at column 5, found unexpected token "," (comma) in expression: foo[0, 1]',
    },
    {
      expression: 'foo.[0]',
      error:
        'Invalid jmespath expression: parse error at column 5, found unexpected token "0" (number) in expression: foo.[0]',
    },
    {
      comment: 'Multi-select of a list with trailing comma',
      expression: 'foo[0, ]',
      error:
        'Invalid jmespath expression: parse error at column 5, found unexpected token "," (comma) in expression: foo[0, ]',
    },
    {
      comment: 'Multi-select of a list with trailing comma and no close',
      expression: 'foo[0,',
      error:
        'Invalid jmespath expression: parse error at column 5, found unexpected token "," (comma) in expression: foo[0,',
    },
    {
      comment: 'Multi-select of a list with trailing comma and no close',
      expression: 'foo.[a',
      error:
        'Invalid jmespath expression: parse error at column 6, found unexpected end of expression (EOF) in expression: foo.[a',
    },
    {
      comment: 'Multi-select of a list with extra comma',
      expression: 'foo[0,, 1]',
      error:
        'Invalid jmespath expression: parse error at column 5, found unexpected token "," (comma) in expression: foo[0,, 1]',
    },
    {
      comment: 'Multi-select of a list using an identifier index',
      expression: 'foo[abc]',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "abc" (unquoted_identifier) in expression: foo[abc]',
    },
    {
      comment: 'Multi-select of a list using identifier indices',
      expression: 'foo[abc, def]',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "abc" (unquoted_identifier) in expression: foo[abc, def]',
    },
    {
      comment: 'Multi-select of a list using an identifier index',
      expression: 'foo[abc, 1]',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "abc" (unquoted_identifier) in expression: foo[abc, 1]',
    },
    {
      comment:
        'Multi-select of a list using an identifier index with trailing comma',
      expression: 'foo[abc, ]',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "abc" (unquoted_identifier) in expression: foo[abc, ]',
    },
    {
      comment: 'Multi-select of a hash using a numeric index',
      expression: 'foo.[abc, 1]',
      error:
        'Invalid jmespath expression: parse error at column 10, found unexpected token "1" (number) in expression: foo.[abc, 1]',
    },
    {
      comment: 'Multi-select of a hash with a trailing comma',
      expression: 'foo.[abc, ]',
      error:
        'Invalid jmespath expression: parse error at column 10, found unexpected token "]" (rbracket) in expression: foo.[abc, ]',
    },
    {
      comment: 'Multi-select of a hash with extra commas',
      expression: 'foo.[abc,, def]',
      error:
        'Invalid jmespath expression: parse error at column 9, found unexpected token "," (comma) in expression: foo.[abc,, def]',
    },
    {
      comment: 'Multi-select of a hash using number indices',
      expression: 'foo.[0, 1]',
      error:
        'Invalid jmespath expression: parse error at column 5, found unexpected token "0" (number) in expression: foo.[0, 1]',
    },
  ])('multi-select list errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      comment: 'Valid multi-select hash extraction',
      expression: 'a.{foo: bar}',
      expected: null,
    },
    {
      comment: 'Valid multi-select hash extraction',
      expression: 'a.{foo: bar, baz: bam}',
      expected: null,
    },
    {
      comment: 'Nested multi select',
      expression: '{"\\\\":{" ":*}}',
      expected: {
        '\\': {
          ' ': ['object'],
        },
      },
    },
  ])(
    'should support multy-select hash syntax: $expression',
    ({ expression, expected }) => {
      // Prepare
      const data = { type: 'object' };

      // Act
      const result = search(expression, data);

      // Assess
      expect(result).toStrictEqual(expected);
    }
  );

  it.each([
    {
      comment: 'No key or value',
      expression: 'a{}',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "}" (rbrace) in expression: a{}',
    },
    {
      comment: 'No closing token',
      expression: 'a{',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected end of expression (EOF) in expression: a{',
    },
    {
      comment: 'Not a key value pair',
      expression: 'a{foo}',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "foo" (unquoted_identifier) in expression: a{foo}',
    },
    {
      comment: 'Missing value and closing character',
      expression: 'a{foo:',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "foo" (unquoted_identifier) in expression: a{foo:',
    },
    {
      comment: 'Missing closing character',
      expression: 'a{foo: 0',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "foo" (unquoted_identifier) in expression: a{foo: 0',
    },
    {
      comment: 'Missing value',
      expression: 'a{foo:}',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "foo" (unquoted_identifier) in expression: a{foo:}',
    },
    {
      comment: 'Trailing comma and no closing character',
      expression: 'a{foo: 0, ',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "foo" (unquoted_identifier) in expression: a{foo: 0, ',
    },
    {
      comment: 'Missing value with trailing comma',
      expression: 'a{foo: ,}',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "foo" (unquoted_identifier) in expression: a{foo: ,}',
    },
    {
      comment: 'Accessing Array using an identifier',
      expression: 'a{foo: bar}',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "foo" (unquoted_identifier) in expression: a{foo: bar}',
    },
    {
      expression: 'a{foo: 0}',
      error:
        'Invalid jmespath expression: parse error at column 2, found unexpected token "foo" (unquoted_identifier) in expression: a{foo: 0}',
    },
    {
      comment: 'Missing key-value pair',
      expression: 'a.{}',
      error:
        'Invalid jmespath expression: parse error at column 3, found unexpected token "}" (rbrace) in expression: a.{}',
    },
    {
      comment: 'Not a key-value pair',
      expression: 'a.{foo}',
      error:
        'Invalid jmespath expression: parse error at column 6, found unexpected token "}" (rbrace) in expression: a.{foo}',
    },
    {
      comment: 'Missing value',
      expression: 'a.{foo:}',
      error:
        'Invalid jmespath expression: parse error at column 7, found unexpected token "}" (rbrace) in expression: a.{foo:}',
    },
    {
      comment: 'Missing value with trailing comma',
      expression: 'a.{foo: ,}',
      error:
        'Invalid jmespath expression: parse error at column 8, found unexpected token "," (comma) in expression: a.{foo: ,}',
    },
    {
      comment: 'Trailing comma',
      expression: 'a.{foo: bar, }',
      error:
        'Invalid jmespath expression: parse error at column 13, found unexpected token "}" (rbrace) in expression: a.{foo: bar, }',
    },
    {
      comment: 'Missing key in second key-value pair',
      expression: 'a.{foo: bar, baz}',
      error:
        'Invalid jmespath expression: parse error at column 16, found unexpected token "}" (rbrace) in expression: a.{foo: bar, baz}',
    },
    {
      comment: 'Missing value in second key-value pair',
      expression: 'a.{foo: bar, baz:}',
      error:
        'Invalid jmespath expression: parse error at column 17, found unexpected token "}" (rbrace) in expression: a.{foo: bar, baz:}',
    },
    {
      comment: 'Trailing comma',
      expression: 'a.{foo: bar, baz: bam, }',
      error:
        'Invalid jmespath expression: parse error at column 23, found unexpected token "}" (rbrace) in expression: a.{foo: bar, baz: bam, }',
    },
  ])('multi-select hash errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'foo || bar',
      expected: null,
    },
    {
      expression: 'foo.[a || b]',
      expected: null,
    },
  ])(
    'should support boolean OR syntax: $expression',
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
      expression: 'foo ||',
      error:
        'Invalid jmespath expression: parse error at column 6, found unexpected end of expression (EOF) in expression: foo ||',
    },
    {
      expression: 'foo.|| bar',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "||" (or) in expression: foo.|| bar',
    },
    {
      expression: ' || foo',
      error:
        'Invalid jmespath expression: parse error at column 1, found unexpected token "||" (or) in expression:  || foo',
    },
    {
      expression: 'foo || || foo',
      error:
        'Invalid jmespath expression: parse error at column 7, found unexpected token "||" (or) in expression: foo || || foo',
    },
    {
      expression: 'foo.[a ||]',
      error:
        'Invalid jmespath expression: parse error at column 9, found unexpected token "]" (rbracket) in expression: foo.[a ||]',
    },
    {
      expression: '"foo',
      error:
        'Bad jmespath expression: unknown token ""foo" at column 0 in expression: "foo',
    },
  ])('boolean OR errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'foo[?bar==`"baz"`]',
      expected: null,
    },
    {
      expression: 'foo[? bar == `"baz"` ]',
      expected: null,
    },
    {
      expression: 'foo[?a.b.c==d.e.f]',
      expected: null,
    },
    {
      expression: 'foo[?bar==`[0, 1, 2]`]',
      expected: null,
    },
    {
      expression: 'foo[?bar==`["a", "b", "c"]`]',
      expected: null,
    },
    {
      comment: 'Literal char escaped',
      expression: 'foo[?bar==`["foo\\`bar"]`]',
      expected: null,
    },
    {
      comment: 'Quoted identifier in filter expression no spaces',
      expression: '[?"\\\\">`"foo"`]',
      expected: null,
    },
    {
      comment: 'Quoted identifier in filter expression with spaces',
      expression: '[?"\\\\" > `"foo"`]',
      expected: null,
    },
  ])(
    'should support filter syntax: $expression',
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
      expression: 'foo[ ?bar==`"baz"`]',
      error:
        'Bad jmespath expression: unknown token "?" at column 5 in expression: foo[ ?bar==`"baz"`]',
    },
    {
      expression: 'foo[?bar==]',
      error:
        'Invalid jmespath expression: parse error at column 10, found unexpected token "]" (rbracket) in expression: foo[?bar==]',
    },
    {
      expression: 'foo[?==]',
      error:
        'Invalid jmespath expression: parse error at column 6, found unexpected token "==" (eq) in expression: foo[?==]',
    },
    {
      expression: 'foo[?==bar]',
      error:
        'Invalid jmespath expression: parse error at column 6, found unexpected token "==" (eq) in expression: foo[?==bar]',
    },
    {
      expression: 'foo[?bar==baz?]',
      error:
        'Bad jmespath expression: unknown token "?" at column 13 in expression: foo[?bar==baz?]',
    },
    {
      comment: 'Literal char not escaped',
      expression: 'foo[?bar==`["foo`bar"]`]',
      error:
        'Bad jmespath expression: unknown token "["foo" at column 10 in expression: foo[?bar==`["foo`bar"]`]',
    },
    {
      comment: 'Unknown comparator',
      expression: 'foo[?bar<>baz]',
      error:
        'Invalid jmespath expression: parse error at column 9, found unexpected token ">" (gt) in expression: foo[?bar<>baz]',
    },
    {
      comment: 'Unknown comparator',
      expression: 'foo[?bar^baz]',
      error:
        'Bad jmespath expression: unknown token "^" at column 8 in expression: foo[?bar^baz]',
    },
    {
      expression: 'foo[bar==baz]',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "bar" (unquoted_identifier) in expression: foo[bar==baz]',
    },
    {
      expression: 'bar.`"anything"`',
      error:
        'Invalid jmespath expression: parse error at column 4, found unexpected token "anything" (literal) in expression: bar.`"anything"`',
    },
    {
      expression: 'bar.baz.noexists.`"literal"`',
      error:
        'Invalid jmespath expression: parse error at column 17, found unexpected token "literal" (literal) in expression: bar.baz.noexists.`"literal"`',
    },
    {
      comment: 'Literal wildcard projection',
      expression: 'foo[*].`"literal"`',
      error:
        'Invalid jmespath expression: parse error at column 7, found unexpected token "literal" (literal) in expression: foo[*].`"literal"`',
    },
    {
      expression: 'foo[*].name.`"literal"`',
      error:
        'Invalid jmespath expression: parse error at column 12, found unexpected token "literal" (literal) in expression: foo[*].name.`"literal"`',
    },
    {
      expression: 'foo[].name.`"literal"`',
      error:
        'Invalid jmespath expression: parse error at column 11, found unexpected token "literal" (literal) in expression: foo[].name.`"literal"`',
    },
    {
      expression: 'foo[].name.`"literal"`.`"subliteral"`',
      error:
        'Invalid jmespath expression: parse error at column 11, found unexpected token "literal" (literal) in expression: foo[].name.`"literal"`.`"subliteral"`',
    },
    {
      comment: 'Projecting a literal onto an empty list',
      expression: 'foo[*].name.noexist.`"literal"`',
      error:
        'Invalid jmespath expression: parse error at column 20, found unexpected token "literal" (literal) in expression: foo[*].name.noexist.`"literal"`',
    },
    {
      expression: 'foo[].name.noexist.`"literal"`',
      error:
        'Invalid jmespath expression: parse error at column 19, found unexpected token "literal" (literal) in expression: foo[].name.noexist.`"literal"`',
    },
    {
      expression: 'twolen[*].`"foo"`',
      error:
        'Invalid jmespath expression: parse error at column 10, found unexpected token "foo" (literal) in expression: twolen[*].`"foo"`',
    },
    {
      comment: 'Two level projection of a literal',
      expression: 'twolen[*].threelen[*].`"bar"`',
      error:
        'Invalid jmespath expression: parse error at column 22, found unexpected token "bar" (literal) in expression: twolen[*].threelen[*].`"bar"`',
    },
    {
      comment: 'Two level flattened projection of a literal',
      expression: 'twolen[].threelen[].`"bar"`',
      error:
        'Invalid jmespath expression: parse error at column 20, found unexpected token "bar" (literal) in expression: twolen[].threelen[].`"bar"`',
    },
  ])('filter errors: $expression', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'foo',
      expected: null,
    },
    {
      expression: '"foo"',
      expected: null,
    },
    {
      expression: '"\\\\"',
      expected: null,
    },
  ])('should support identifiers: $expression', ({ expression, expected }) => {
    // Prepare
    const data = { type: 'object' };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      expression: '*||*|*|*',
      expected: null,
    },
    {
      expression: '*[]||[*]',
      expected: [],
    },
    {
      expression: '[*.*]',
      expected: [null],
    },
  ])(
    'should support combined syntax: $expression',
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

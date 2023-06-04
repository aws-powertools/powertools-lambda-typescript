import { search } from '../../src';

describe('Syntax tests', () => {
  it.each([
    {
      expression: 'foo.bar',
      expected: null,
    },
    {
      expression: 'foo.1',
      error: 'Syntax error, unexpected token: 1(Number)',
    },
    {
      expression: 'foo.-11',
      error: 'Syntax error, unexpected token: -11(Number)',
    },
    {
      expression: 'foo',
      expected: null,
    },
    {
      expression: 'foo.',
      error: 'Syntax error, unexpected token: (EOF)',
    },
    {
      expression: 'foo.',
      error: 'Syntax error, unexpected token: (EOF)',
    },
    {
      expression: '.foo',
      error: 'Invalid token (Dot): "."',
    },
    {
      expression: 'foo..bar',
      error: 'Syntax error, unexpected token: .(Dot)',
    },
    {
      expression: 'foo.bar.',
      error: 'Syntax error, unexpected token: (EOF)',
    },
    {
      expression: 'foo[.]',
      error: 'Expected Star, got: Dot',
    },
  ])('should support dot syntax', ({ expression, error }) => {
    // Prepare
    const data = {
      type: 'object',
    };

    // Act & Assess
    expect(() => search(expression, data)).toThrow(error);
  });

  it.each([
    {
      expression: 'foo.1',
      error: 'Syntax error, unexpected token: 1(Number)',
    },
    {
      expression: 'foo.-11',
      error: 'Syntax error, unexpected token: -11(Number)',
    },
    {
      expression: 'foo.',
      error: 'Syntax error, unexpected token: (EOF)',
    },
    {
      expression: 'foo.',
      error: 'Syntax error, unexpected token: (EOF)',
    },
    {
      expression: '.foo',
      error: 'Invalid token (Dot): "."',
    },
    {
      expression: 'foo..bar',
      error: 'Syntax error, unexpected token: .(Dot)',
    },
    {
      expression: 'foo.bar.',
      error: 'Syntax error, unexpected token: (EOF)',
    },
    {
      expression: 'foo[.]',
      error: 'Expected Star, got: Dot',
    },
    {
      expression: '.',
      error: 'Invalid token (Dot): "."',
    },
    {
      expression: ':',
      error: 'Invalid token (Colon): ":"',
    },
    {
      expression: ',',
      error: 'Invalid token (Comma): ","',
    },
    {
      expression: ']',
      error: 'Invalid token (Rbracket): "]"',
    },
    {
      expression: '[',
      error: 'Invalid token (EOF): ""',
    },
    {
      expression: '}',
      error: 'Invalid token (Rbrace): "}"',
    },
    {
      expression: '{',
      error: 'Expecting an identifier token, got: EOF',
    },
    {
      expression: ')',
      error: 'Invalid token (Rparen): ")"',
    },
    {
      expression: '(',
      error: 'Invalid token (EOF): ""',
    },
    {
      expression: '((&',
      error: 'Invalid token (EOF): ""',
    },
    {
      expression: 'a[',
      error: 'Expected Star, got: EOF',
    },
    {
      expression: 'a]',
      error: 'Unexpected token type: Rbracket, value: ]',
    },
    {
      expression: 'a][',
      error: 'Unexpected token type: Rbracket, value: ]',
    },
    {
      expression: '!',
      error: 'Invalid token (EOF): ""',
    },
  ])('simple token errors', ({ expression, error }) => {
    // TODO: see if we can assert the error type as well in simple token errors tests
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
      error: 'Invalid token (EOF): ""',
    },
  ])('boolean token errors', ({ expression, error }) => {
    // TODO: see if we can assert the error type as well in boolean token errors tests
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
  ])('shoudl support wildcard syntax', ({ expression, expected }) => {
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
      expression: '.*',
      error: 'Invalid token (Dot): "."',
    },
    {
      expression: '*foo',
      error: 'Unexpected token type: UnquotedIdentifier, value: foo',
    },
    {
      expression: '*0',
      error: 'Unexpected token type: Number, value: 0',
    },
    {
      expression: 'foo[*]bar',
      error: 'Unexpected token type: UnquotedIdentifier, value: bar',
    },
    {
      expression: 'foo[*]*',
      error: 'Syntax error, unexpected token: *(Star)',
    },
  ])('wildcard token errors', ({ expression, error }) => {
    // TODO: see if we can assert the error type as well in wildcard token errors tests
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
  ])('should support flatten syntax', ({ expression, expected }) => {
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
  ])('simple bracket syntax', ({ expression, expected }) => {
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
      error: 'Invalid token (Number): "0"',
    },
    {
      expression: 'foo[#]',
      error: 'Unknown character: #',
    },
  ])('simple breacket errors', ({ expression, error }) => {
    // TODO: see if we can assert the error type as well in simple bracket errors tests
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
  ])('should support multi-select list syntax', ({ expression, expected }) => {
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
      comment: 'Valid multi-select of a list',
      expression: 'foo[0, 1]',
      error: 'Expected Rbracket, got: Comma',
    },
    {
      expression: 'foo.[0]',
      error: 'Invalid token (Number): "0"',
    },
    {
      comment: 'Multi-select of a list with trailing comma',
      expression: 'foo[0, ]',
      error: 'Expected Rbracket, got: Comma',
    },
    {
      comment: 'Multi-select of a list with trailing comma and no close',
      expression: 'foo[0,',
      error: 'Expected Rbracket, got: Comma',
    },
    {
      comment: 'Multi-select of a list with trailing comma and no close',
      expression: 'foo.[a',
      error: 'Invalid token (EOF): ""',
    },
    {
      comment: 'Multi-select of a list with extra comma',
      expression: 'foo[0,, 1]',
      error: 'Expected Rbracket, got: Comma',
    },
    {
      comment: 'Multi-select of a list using an identifier index',
      expression: 'foo[abc]',
      error: 'Expected Star, got: UnquotedIdentifier',
    },
    {
      comment: 'Multi-select of a list using identifier indices',
      expression: 'foo[abc, def]',
      error: 'Expected Star, got: UnquotedIdentifier',
    },
    {
      comment: 'Multi-select of a list using an identifier index',
      expression: 'foo[abc, 1]',
      error: 'Expected Star, got: UnquotedIdentifier',
    },
    {
      comment:
        'Multi-select of a list using an identifier index with trailing comma',
      expression: 'foo[abc, ]',
      error: 'Expected Star, got: UnquotedIdentifier',
    },
    {
      comment: 'Multi-select of a hash using a numeric index',
      expression: 'foo.[abc, 1]',
      error: 'Invalid token (Number): "1"',
    },
    {
      comment: 'Multi-select of a hash with a trailing comma',
      expression: 'foo.[abc, ]',
      error: 'Unexpected token Rbracket',
    },
    {
      comment: 'Multi-select of a hash with extra commas',
      expression: 'foo.[abc,, def]',
      error: 'Invalid token (Comma): ","',
    },
    {
      comment: 'Multi-select of a hash using number indices',
      expression: 'foo.[0, 1]',
      error: 'Invalid token (Number): "0"',
    },
  ])('multi-select list errors', ({ expression, error }) => {
    // TODO: see if we can assert the error type as well in multi-select list errors tests
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
  ])('should support multy-select hash syntax', ({ expression, expected }) => {
    // Prepare
    const data = { type: 'object' };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it.each([
    {
      comment: 'No key or value',
      expression: 'a{}',
      error: 'Invalid token (Rbrace): "}"',
    },
    {
      comment: 'No closing token',
      expression: 'a{',
      error: 'Invalid token (EOF): ""',
    },
    {
      comment: 'Not a key value pair',
      expression: 'a{foo}',
      error: 'Invalid token (UnquotedIdentifier): "foo"',
    },
    {
      comment: 'Missing value and closing character',
      expression: 'a{foo:',
      error: 'Invalid token (UnquotedIdentifier): "foo"',
    },
    {
      comment: 'Missing closing character',
      expression: 'a{foo: 0',
      error: 'Invalid token (UnquotedIdentifier): "foo"',
    },
    {
      comment: 'Missing value',
      expression: 'a{foo:}',
      error: 'Invalid token (UnquotedIdentifier): "foo"',
    },
    {
      comment: 'Trailing comma and no closing character',
      expression: 'a{foo: 0, ',
      error: 'Invalid token (UnquotedIdentifier): "foo"',
    },
    {
      comment: 'Missing value with trailing comma',
      expression: 'a{foo: ,}',
      error: 'Invalid token (UnquotedIdentifier): "foo"',
    },
    {
      comment: 'Accessing Array using an identifier',
      expression: 'a{foo: bar}',
      error: 'Invalid token (UnquotedIdentifier): "foo"',
    },
    {
      expression: 'a{foo: 0}',
      error: 'Invalid token (UnquotedIdentifier): "foo"',
    },
    {
      comment: 'Missing key-value pair',
      expression: 'a.{}',
      error: 'Expecting an identifier token, got: Rbrace',
    },
    {
      comment: 'Not a key-value pair',
      expression: 'a.{foo}',
      error: 'Expected Colon, got: Rbrace',
    },
    {
      comment: 'Missing value',
      expression: 'a.{foo:}',
      error: 'Invalid token (Rbrace): "}"',
    },
    {
      comment: 'Missing value with trailing comma',
      expression: 'a.{foo: ,}',
      error: 'Invalid token (Comma): ","',
    },
    {
      comment: 'Trailing comma',
      expression: 'a.{foo: bar, }',
      error: 'Expecting an identifier token, got: Rbrace',
    },
    {
      comment: 'Missing key in second key-value pair',
      expression: 'a.{foo: bar, baz}',
      error: 'Expected Colon, got: Rbrace',
    },
    {
      comment: 'Missing value in second key-value pair',
      expression: 'a.{foo: bar, baz:}',
      error: 'Invalid token (Rbrace): "}"',
    },
    {
      comment: 'Trailing comma',
      expression: 'a.{foo: bar, baz: bam, }',
      error: 'Expecting an identifier token, got: Rbrace',
    },
  ])('multi-select hash errors', ({ expression, error }) => {
    // TODO: see if we can assert the error type as well in multi-select hash errors tests
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
  ])('should support boolean OR syntax', ({ expression, expected }) => {
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
      expression: 'foo ||',
      error: 'Invalid token (EOF): ""',
    },
    {
      expression: 'foo.|| bar',
      error: 'Syntax error, unexpected token: ||(Or)',
    },
    {
      expression: ' || foo',
      error: 'Invalid token (Or): "||"',
    },
    {
      expression: 'foo || || foo',
      error: 'Invalid token (Or): "||"',
    },
    {
      expression: 'foo.[a ||]',
      error: 'Invalid token (Rbracket): "]"',
    },
    {
      expression: '"foo',
      error: 'Unexpected end of JSON input',
    },
  ])('boolean OR errors', ({ expression, error }) => {
    // TODO: see if we can assert the error type as well in boolean OR errors tests
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
  ])('should support filter syntax', ({ expression, expected }) => {
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
      expression: 'foo[ ?bar==`"baz"`]',
      error: 'Unknown character: ?',
    },
    {
      expression: 'foo[?bar==]',
      error: 'Invalid token (Rbracket): "]"',
    },
    {
      expression: 'foo[?==]',
      error: 'Invalid token (EQ): "=="',
    },
    {
      expression: 'foo[?==bar]',
      error: 'Invalid token (EQ): "=="',
    },
    {
      expression: 'foo[?bar==baz?]',
      error: 'Unknown character: ?',
    },
    {
      comment: 'Literal char not escaped',
      expression: 'foo[?bar==`["foo`bar"]`]',
      error: 'Unexpected end of JSON input',
    },
    {
      comment: 'Unknown comparator',
      expression: 'foo[?bar<>baz]',
      error: 'Invalid token (GT): ">"',
    },
    {
      comment: 'Unknown comparator',
      expression: 'foo[?bar^baz]',
      error: 'Unknown character: ^',
    },
    {
      expression: 'foo[bar==baz]',
      error: 'Expected Star, got: UnquotedIdentifier',
    },
    {
      expression: 'bar.`"anything"`',
      error: 'Syntax error, unexpected token: anything(Literal)',
    },
    {
      expression: 'bar.baz.noexists.`"literal"`',
      error: 'Syntax error, unexpected token: literal(Literal)',
    },
    {
      comment: 'Literal wildcard projection',
      expression: 'foo[*].`"literal"`',
      error: 'Syntax error, unexpected token: literal(Literal)',
    },
    {
      expression: 'foo[*].name.`"literal"`',
      error: 'Syntax error, unexpected token: literal(Literal)',
    },
    {
      expression: 'foo[].name.`"literal"`',
      error: 'Syntax error, unexpected token: literal(Literal)',
    },
    {
      expression: 'foo[].name.`"literal"`.`"subliteral"`',
      error: 'Syntax error, unexpected token: literal(Literal)',
    },
    {
      comment: 'Projecting a literal onto an empty list',
      expression: 'foo[*].name.noexist.`"literal"`',
      error: 'Syntax error, unexpected token: literal(Literal)',
    },
    {
      expression: 'foo[].name.noexist.`"literal"`',
      error: 'Syntax error, unexpected token: literal(Literal)',
    },
    {
      expression: 'twolen[*].`"foo"`',
      error: 'Syntax error, unexpected token: foo(Literal)',
    },
    {
      comment: 'Two level projection of a literal',
      expression: 'twolen[*].threelen[*].`"bar"`',
      error: 'Syntax error, unexpected token: bar(Literal)',
    },
    {
      comment: 'Two level flattened projection of a literal',
      expression: 'twolen[].threelen[].`"bar"`',
      error: 'Syntax error, unexpected token: bar(Literal)',
    },
  ])('filter errors', ({ expression, error }) => {
    // TODO: see if we can assert the error type as well in filter errors tests
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
  ])('should support identifiers', ({ expression, expected }) => {
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
  ])('should support combined syntax', ({ expression, expected }) => {
    // Prepare
    const data = { type: 'object' };

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });
});

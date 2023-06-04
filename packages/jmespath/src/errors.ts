import type { Token } from './types';

/**
 * TODO: write docs for JMESPathError
 */
class JMESPathError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'JMESPathError';
  }
}

/**
 * TODO: write docs for LexerError
 */
class LexerError extends JMESPathError {
  /**
   * Expression that was being parsed when the error occurred.
   *
   * Can be set by whatever catches the error.
   */
  public expression?: string;
  public lexerPosition: number;
  public lexerValue: string;

  public constructor(lexerPosition: number, lexerValue: string) {
    super('Bad jmespath expression');
    this.name = 'LexerError';
    this.lexerPosition = lexerPosition;
    this.lexerValue = lexerValue;

    // Set the message to include the lexer position and value.
    this.message = `${super.message}: ${this.expression} at position ${
      this.lexerPosition
    }: ${this.lexerValue}`;
  }
}

/**
 * TODO: write docs for ParseError
 *
 * @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/exceptions.py#L9
 */
class ParseError extends JMESPathError {
  /**
   * Expression that was being parsed when the error occurred.
   *
   * Can be set by whatever catches the error.
   */
  public expression?: string;
  public lexPosition: number;
  public reason?: string;
  public tokenType: Token['type'];
  public tokenValue: Token['value'];

  public constructor(options: {
    lexPosition: number;
    tokenValue: Token['value'];
    tokenType: Token['type'];
    reason?: string;
  }) {
    super('Invalid jmespath expression');
    this.name = 'ParseError';
    this.lexPosition = options.lexPosition;
    this.tokenValue = options.tokenValue;
    this.tokenType = options.tokenType;
    this.reason = options.reason;

    // Set the message to include the lexer position and token info.
    this.message = `${super.message}: ${this.reason}\nParse error at column ${
      this.lexPosition
    }, token "${this.tokenValue}" (${this.tokenType}), for expression:\n${
      this.expression
    }`;
  }
}

/**
 * TODO: complete IncompleteExpressionError implementation
 * TODO: write docs for IncompleteExpressionError
 * TODO: add `name` to `IncompleteExpressionError`
 *
 * @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/exceptions.py#L32
 */
class IncompleteExpressionError extends ParseError {
  /**
   * Expression that was being parsed when the error occurred.
   *
   * Can be set by whatever catches the error.
   */
  public expression?: string;
}

/**
 * TODO: write docs for ArityError
 * TODO: complete ArityError implementation
 * @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/exceptions.py#LL66C1-L85C30
 */
/* class ArityError extends ParseError {
  public actualArity: number;
  public expectedArity: number;
  public functionName: string;

  public constructor(options: {
    expectedArity: number;
    actualArity: number;
    functionName: string;
  }) {
    this.name = 'ArityError';
    this.actualArity = options.actualArity;
    this.expectedArity = options.expectedArity;
    this.functionName = options.functionName;
  }

  #pluralize(word: string, count: number): string {
    return count === 1 ? word : `${word}s`;
  }
} */

/**
 * TODO: write docs for VariadicArityError
 * TODO: complete VariadicArityError implementation
 * @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/exceptions.py#L89-L96
 * TODO: change extends to ArityError
 * TODO: add `name` to `VariadicArityError`
 */
class VariadicArityError extends ParseError {}

/**
 * TODO: write docs for JMESPathTypeError
 */
class JMESPathTypeError extends JMESPathError {
  public actualType: string;
  public currentValue: unknown;
  public expectedTypes: string;
  public functionName: string;

  public constructor(options: {
    functionName: string;
    currentValue: unknown;
    actualType: string;
    expectedTypes: string;
  }) {
    super('Invalid type for JMESPath expression');
    this.name = 'JMESPathTypeError';
    this.functionName = options.functionName;
    this.currentValue = options.currentValue;
    this.actualType = options.actualType;
    this.expectedTypes = options.expectedTypes;

    // Set the message to include the error info.
    this.message = `${super.message}: function ${
      this.functionName
    } expected one of: ${this.expectedTypes}, received: ${this.actualType}`;
  }
}

/**
 * TODO: write docs for EmptyExpressionError
 */
class EmptyExpressionError extends JMESPathError {
  public constructor() {
    super('Invalid JMESPath expression: cannot be empty.');
    this.name = 'EmptyExpressionError';
  }
}

/**
 * TODO: write docs for UnknownFunctionError
 */
class UnknownFunctionError extends JMESPathError {}

export {
  JMESPathError,
  LexerError,
  ParseError,
  IncompleteExpressionError,
  // ArityError,
  VariadicArityError,
  JMESPathTypeError,
  EmptyExpressionError,
  UnknownFunctionError,
};

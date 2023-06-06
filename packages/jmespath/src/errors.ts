import type { Token } from './types';

/**
 * TODO: write docs for JMESPathError
 */
class JMESPathError extends Error {
  /**
   * Expression that was being parsed when the error occurred.
   * Can be set by whatever catches the error.
   */
  public expression?: string;

  public constructor(message: string) {
    super(message);
    this.name = 'JMESPathError';
    this.message = message;
  }

  /**
   * Set the expression that was being parsed when the error occurred.
   *
   * The separate method allows the expression to be set after the error is
   * thrown. In some instances the expression is not known until after the
   * error is thrown (i.e. the error is thrown down the call stack).
   *
   * @param expression The expression that was being parsed when the error occurred.
   */
  public setExpression(expression: string): void {
    this.expression = expression;

    // Set the message to include the expression.
    this.message = `${this.message} for expression: ${this.expression}`;
  }
}

/**
 * Error thrown when an unknown token is encountered during the AST construction.
 * TODO: improve field names for LexerError
 */
class LexerError extends JMESPathError {
  /**
   * Position in the expression where the error occurred.
   */
  public lexerPosition: number;
  /**
   * Token value where the error occurred.
   */
  public lexerValue: string;

  public constructor(lexerPosition: number, lexerValue: string) {
    super('Bad jmespath expression');
    this.name = 'LexerError';
    this.lexerPosition = lexerPosition;
    this.lexerValue = lexerValue;

    // Set the message to include the lexer position and value.
    this.message = `${this.message}: unknown token "${this.lexerValue}" at column ${this.lexerPosition}`;
  }
}

/**
 * Error thrown when an invalid or unexpected token type or value is encountered during parsing.
 * TODO: improve field names for ParseError
 */
class ParseError extends JMESPathError {
  /**
   * Position in the expression where the error occurred.
   */
  public lexPosition: number;
  /**
   * Additional information about the error.
   */
  public reason?: string;
  /**
   * Token type where the error occurred.
   */
  public tokenType: Token['type'];
  /**
   * Token value where the error occurred.
   */
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
    const issue =
      this.tokenType === 'eof'
        ? 'found unexpected end of expression (EOF)'
        : `found unexpected token "${this.tokenValue}" (${this.tokenType})`;
    this.message = `${this.message}: parse error at column ${this.lexPosition}, ${issue}`;
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
 */
class ArityError extends JMESPathError {
  public actualArity: number;
  public expectedArity: number;
  public functionName: string;

  public constructor(options: {
    expectedArity: number;
    actualArity: number;
    functionName: string;
  }) {
    super('Invalid arity for JMESPath function');
    this.name = 'ArityError';
    this.actualArity = options.actualArity;
    this.expectedArity = options.expectedArity;
    this.functionName = options.functionName;

    // Set the message to include the error info.
    this.message = `Expected at least ${this.expectedArity} ${this.pluralize(
      'argument',
      this.expectedArity
    )} for function ${this.functionName}, received: ${this.actualArity}`;
  }

  protected pluralize(word: string, count: number): string {
    return count === 1 ? word : `${word}s`;
  }
}

/**
 * TODO: write docs for VariadicArityError
 */
class VariadicArityError extends ArityError {
  public constructor(options: {
    expectedArity: number;
    actualArity: number;
    functionName: string;
  }) {
    super(options);
    this.name = 'VariadicArityError';
  }
}

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
  ArityError,
  VariadicArityError,
  JMESPathTypeError,
  EmptyExpressionError,
  UnknownFunctionError,
};

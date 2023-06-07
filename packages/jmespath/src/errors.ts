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
    this.message = `${this.message} in expression: ${this.expression}`;
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
 * TODO: write docs for EmptyExpressionError
 * TODO: see if this is ever being thrown
 */
class EmptyExpressionError extends JMESPathError {
  public constructor() {
    super('Invalid JMESPath expression: cannot be empty.');
    this.name = 'EmptyExpressionError';
  }
}

/**
 * Base class for errors thrown during function execution.
 *
 * When writing a JMESPath expression, you can use functions to transform the
 * data. For example, the `abs()` function returns the absolute value of a number.
 *
 * If an error occurs during function execution, the error is thrown as a
 * subclass of `FunctionError`. The subclass is determined by the type of error
 * that occurred.
 *
 * Errors can be thrown while validating the arguments passed to a function, or
 * while executing the function itself.
 */
class FunctionError extends JMESPathError {
  /**
   * Function that was being executed when the error occurred.
   * Can be set by whatever catches the error.
   */
  public functionName?: string;

  public constructor(message: string) {
    super(message);
    this.name = 'FunctionError';
  }

  /**
   * Set the function that was being validated or executed when the error occurred.
   *
   * The separate method allows the name to be set after the error is
   * thrown. In most cases the error is thrown down the call stack, but we want
   * to show the actual function name used in the expression rather than an internal
   * alias. To avoid passing the function name down the call stack, we set it
   * after the error is thrown.
   *
   * @param functionName The function that was being validated or executed when the error occurred.
   */
  public setFunctionName(functionName: string): void {
    this.message = this.message.replace(
      'for function undefined',
      `for function ${functionName}()`
    );
  }
}

/**
 * Error thrown when an unexpected argument is passed to a function.
 *
 * Function arguments are validated before the function is executed. If an
 * invalid argument is passed, the error is thrown. For example, the `abs()`
 * function expects exactly one argument. If more than one argument is passed,
 * an `ArityError` is thrown.
 */
class ArityError extends FunctionError {
  public actualArity: number;
  public expectedArity: number;

  public constructor(options: { expectedArity: number; actualArity: number }) {
    super('Invalid arity for JMESPath function');
    this.name = 'ArityError';
    this.actualArity = options.actualArity;
    this.expectedArity = options.expectedArity;

    const arityParticle =
      this.actualArity > this.expectedArity ? 'at most' : 'at least';

    // Set the message to include the error info.
    this.message = `Expected ${arityParticle} ${
      this.expectedArity
    } ${this.pluralize('argument', this.expectedArity)} for function ${
      this.functionName
    }, received ${this.actualArity}`;
  }

  protected pluralize(word: string, count: number): string {
    return count === 1 ? word : `${word}s`;
  }
}

/**
 * TODO: write docs for VariadicArityError
 */
class VariadicArityError extends ArityError {
  public constructor(options: { expectedArity: number; actualArity: number }) {
    super(options);
    this.name = 'VariadicArityError';

    // Set the message to include the error info.
    this.message = `Expected ${this.expectedArity} ${this.pluralize(
      'argument',
      this.expectedArity
    )} for function ${this.functionName}, received ${this.actualArity}`;
  }
}

/**
 * Error thrown when an invalid argument type is passed to a built-in function.
 *
 * Function arguments are validated before the function is executed. If an
 * invalid argument type is found, this error is thrown. For example, the
 * `abs()` function expects a number as its argument. If a string is passed
 * instead, this error is thrown.
 */
class JMESPathTypeError extends FunctionError {
  public actualType: string;
  public currentValue: unknown;
  public expectedTypes: string[];

  public constructor(options: {
    currentValue: unknown;
    actualType: string;
    expectedTypes: string[];
  }) {
    super('Invalid type for JMESPath expression');
    this.name = 'JMESPathTypeError';
    this.currentValue = options.currentValue;
    this.actualType = options.actualType;
    this.expectedTypes = options.expectedTypes;

    // Set the message to include the error info.
    this.message = `Invalid argument type for function ${
      this.functionName
    }, expected ${this.serializeExpectedTypes()} but found "${
      this.actualType
    }"`;
  }

  protected serializeExpectedTypes(): string {
    return this.expectedTypes.length === 1
      ? `"${this.expectedTypes[0]}"`
      : `one of ${this.expectedTypes.map((type) => `"${type}"`).join(', ')}`;
  }
}

/**
 * Error thrown when an unknown function is used in an expression.
 *
 * When evaluating a JMESPath expression, the interpreter looks up the function
 * name in a table of built-in functions, as well as any custom functions
 * provided by the user. If the function name is not found, this error is thrown.
 */
class UnknownFunctionError extends FunctionError {
  public constructor() {
    super('Unknown function');
    this.name = 'UnknownFunctionError';

    // Set the message to include the error info.
    this.message = `Unknown function:`;
  }
}

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

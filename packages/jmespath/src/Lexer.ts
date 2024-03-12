import {
  SIMPLE_TOKENS,
  START_IDENTIFIER,
  VALID_IDENTIFIER,
  VALID_NUMBER,
  WHITESPACE,
} from './constants.js';
import { EmptyExpressionError, LexerError } from './errors.js';
import type { Token } from './types.js';

/**
 * A lexer for JMESPath expressions.
 *
 * This lexer tokenizes a JMESPath expression into a sequence of tokens.
 */
class Lexer {
  #position!: number;
  #expression!: string;
  #chars!: string[];
  #current!: string;
  #length!: number;

  /**
   * Tokenize a JMESPath expression.
   *
   * This method is a generator that yields tokens for the given expression.
   *
   * @param expression The JMESPath expression to tokenize.
   */
  public *tokenize(expression: string): Generator<Token> {
    this.#initializeForExpression(expression);
    while (this.#current !== '' && this.#current !== undefined) {
      if (SIMPLE_TOKENS.has(this.#current)) {
        yield {
          // We know that SIMPLE_TOKENS has this.#current as a key because
          // we checked for that above.
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          type: SIMPLE_TOKENS.get(this.#current)!,
          value: this.#current,
          start: this.#position,
          end: this.#position + 1,
        };

        this.#next();
      } else if (START_IDENTIFIER.has(this.#current)) {
        const start = this.#position;
        let buff = this.#current;
        while (VALID_IDENTIFIER.has(this.#next())) {
          buff += this.#current;
        }
        yield {
          type: 'unquoted_identifier',
          value: buff,
          start,
          end: start + buff.length,
        };
      } else if (WHITESPACE.has(this.#current)) {
        this.#next();
      } else if (this.#current === '[') {
        yield this.#consumeSquareBracket();
      } else if (this.#current === `'`) {
        yield this.#consumeRawStringLiteral();
      } else if (this.#current === '|') {
        yield this.#matchOrElse('|', 'or', 'pipe');
      } else if (this.#current === '&') {
        yield this.#matchOrElse('&', 'and', 'expref');
      } else if (this.#current === '`') {
        yield this.#consumeLiteral();
      } else if (VALID_NUMBER.has(this.#current)) {
        const start = this.#position;
        const buff = this.#consumeNumber();
        yield {
          type: 'number',
          value: parseInt(buff),
          start: start,
          end: start + buff.length,
        };
      } else if (this.#current === '-') {
        yield this.#consumeNegativeNumber();
      } else if (this.#current === '"') {
        yield this.#consumeQuotedIdentifier();
      } else if (this.#current === '<') {
        yield this.#matchOrElse('=', 'lte', 'lt');
      } else if (this.#current === '>') {
        yield this.#matchOrElse('=', 'gte', 'gt');
      } else if (this.#current === '!') {
        yield this.#matchOrElse('=', 'ne', 'not');
      } else if (this.#current === '=') {
        yield this.#consumeEqualSign();
      } else {
        throw new LexerError(this.#position, this.#current);
      }
    }
    yield { type: 'eof', value: '', start: this.#length, end: this.#length };
  }

  /**
   * Consume an equal sign.
   *
   * This method is called when the lexer encounters an equal sign.
   * It checks if the next character is also an equal sign and returns
   * the corresponding token.
   */
  #consumeEqualSign(): Token {
    if (this.#next() === '=') {
      this.#next();

      return {
        type: 'eq',
        value: '==',
        start: this.#position - 1,
        end: this.#position,
      };
    } else {
      throw new LexerError(this.#position - 1, '=');
    }
  }

  /**
   * Consume a negative number.
   *
   * This method is called when the lexer encounters a negative sign.
   * It checks if the next character is a number and returns the corresponding token.
   */
  #consumeNegativeNumber(): Token {
    const start = this.#position;
    const buff = this.#consumeNumber();
    if (buff.length > 1) {
      return {
        type: 'number',
        value: parseInt(buff),
        start: start,
        end: start + buff.length,
      };
    } else {
      // If the negative sign is not followed by a number, it is an error.
      throw new LexerError(start, 'Unknown token after "-"');
    }
  }

  /**
   * Consume a raw string that is a number.
   *
   * It takes the current position and advances
   * the lexer until it finds a character that
   * is not a number.
   */
  #consumeNumber(): string {
    let buff = this.#current;
    while (VALID_NUMBER.has(this.#next())) {
      buff += this.#current;
    }

    return buff;
  }

  /**
   * Consume a square bracket.
   *
   * This method is called when the lexer encounters a square bracket.
   * It checks if the next character is a question mark or a closing
   * square bracket and returns the corresponding token.
   */
  #consumeSquareBracket(): Token {
    const start = this.#position;
    const nextChar = this.#next();
    if (nextChar == ']') {
      this.#next();

      return { type: 'flatten', value: '[]', start: start, end: start + 2 };
    } else if (nextChar == '?') {
      this.#next();

      return { type: 'filter', value: '[?', start: start, end: start + 2 };
    } else {
      return { type: 'lbracket', value: '[', start: start, end: start + 1 };
    }
  }

  /**
   * Initializes the lexer for the given expression.
   *
   * We use a separate method for this instead of the constructor
   * because we want to be able to reuse the same lexer instance
   * and also because we want to be able to expose a public API
   * for tokenizing expressions like `new Lexer().tokenize(expression)`.
   *
   * @param expression The JMESPath expression to tokenize.
   */
  #initializeForExpression(expression: string): void {
    if (typeof expression !== 'string') {
      throw new EmptyExpressionError();
    }

    this.#position = 0;
    this.#expression = expression;
    this.#chars = Array.from(expression);
    this.#current = this.#chars[0];
    this.#length = this.#expression.length;
  }

  /**
   * Advance the lexer to the next character in the expression.
   */
  #next(): string {
    if (this.#position === this.#length - 1) {
      this.#current = '';
    } else {
      this.#position += 1;
      this.#current = this.#chars[this.#position];
    }

    return this.#current;
  }

  /**
   * Consume until the given delimiter is reached allowing
   * for escaping of the delimiter with a backslash (`\`).
   *
   * @param delimiter The delimiter to consume until.
   */
  #consumeUntil(delimiter: string): string {
    const start = this.#position;
    let buff = '';
    this.#next();
    while (this.#current !== delimiter) {
      if (this.#current === '\\') {
        buff += '\\';
        this.#next();
      }
      if (this.#current === '') {
        // We've reached the end of the expression (EOF) before
        // we found the delimiter. This is an error.
        throw new LexerError(start, this.#expression.substring(start));
      }
      buff += this.#current;
      this.#next();
    }
    // Skip the closing delimiter
    this.#next();

    return buff;
  }

  /**
   * Process a literal.
   *
   * A literal is a JSON string that is enclosed in backticks.
   */
  #consumeLiteral(): Token {
    const start = this.#position;
    const lexeme = this.#consumeUntil('`').replace('\\`', '`');
    try {
      const parsedJson = JSON.parse(lexeme);

      return {
        type: 'literal',
        value: parsedJson,
        start,
        end: this.#position - start,
      };
    } catch (error) {
      throw new LexerError(start, lexeme);
    }
  }

  /**
   * Process a quoted identifier.
   *
   * A quoted identifier is a string that is enclosed in double quotes.
   */
  #consumeQuotedIdentifier(): Token {
    const start = this.#position;
    const lexeme = '"' + this.#consumeUntil('"') + '"';
    const tokenLen = this.#position - start;

    return {
      type: 'quoted_identifier',
      value: JSON.parse(lexeme),
      start,
      end: tokenLen,
    };
  }

  /**
   * Process a raw string literal.
   *
   * A raw string literal is a string that is enclosed in single quotes.
   */
  #consumeRawStringLiteral(): Token {
    const start = this.#position;
    const lexeme = this.#consumeUntil(`'`).replace(`\\'`, `'`);
    const tokenLen = this.#position - start;

    return {
      type: 'literal',
      value: lexeme,
      start,
      end: tokenLen,
    };
  }

  /**
   * Match the expected character and return the corresponding token type.
   *
   * @param expected The expected character
   * @param matchType The token type to return if the expected character is found
   * @param elseType  The token type to return if the expected character is not found
   */
  #matchOrElse(
    expected: string,
    matchType: Token['type'],
    elseType: Token['type']
  ): Token {
    const start = this.#position;
    const current = this.#current;
    const nextChar = this.#next();
    if (nextChar === expected) {
      this.#next();

      return {
        type: matchType,
        value: current + nextChar,
        start,
        end: start + 2,
      };
    }

    return {
      type: elseType,
      value: current,
      start,
      end: start,
    };
  }
}

export { Lexer };

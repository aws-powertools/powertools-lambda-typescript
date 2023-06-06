import {
  START_IDENTIFIER,
  VALID_IDENTIFIER,
  VALID_NUMBER,
  WHITESPACE,
  SIMPLE_TOKENS,
} from './constants';
import { LexerError, EmptyExpressionError } from './errors';
import type { Token } from './types';

class Lexer {
  #position!: number;
  #expression!: string;
  #chars!: string[];
  #current!: string;
  #length!: number;

  public *tokenize(expression: string): Generator<Token> {
    this.#initializeForExpression(expression);
    while (this.#current !== '') {
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
        const start = this.#position;
        const nextChar = this.#next();
        if (nextChar == ']') {
          this.#next();
          yield { type: 'flatten', value: '[]', start: start, end: start + 2 };
        } else if (nextChar == '?') {
          this.#next();
          yield { type: 'filter', value: '[?', start: start, end: start + 2 };
        } else {
          yield { type: 'lbracket', value: '[', start: start, end: start + 1 };
        }
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
        // Negative number.
        const start = this.#position;
        const buff = this.#consumeNumber();
        if (buff.length > 1) {
          yield {
            type: 'number',
            value: parseInt(buff),
            start: start,
            end: start + buff.length,
          };
        } else {
          throw new LexerError(start, buff);
        }
      } else if (this.#current === '"') {
        yield this.#consumeQuotedIdentifier();
      } else if (this.#current === '<') {
        yield this.#matchOrElse('=', 'lte', 'lt');
      } else if (this.#current === '>') {
        yield this.#matchOrElse('=', 'gte', 'gt');
      } else if (this.#current === '!') {
        yield this.#matchOrElse('=', 'ne', 'not');
      } else if (this.#current === '=') {
        if (this.#next() === '=') {
          yield {
            type: 'eq',
            value: '==',
            start: this.#position - 1,
            end: this.#position,
          };
          this.#next();
        } else {
          let position;
          // TODO: check this this.#current === undefined case
          if (this.#current === undefined) {
            // If we're at the EOF, we never advanced
            // the position so we don't need to rewind
            // it back one location.
            position = this.#position;
          } else {
            position = this.#position - 1;
          }
          throw new LexerError(position, '=');
        }
      } else {
        throw new LexerError(this.#position, this.#current);
      }
    }
    yield { type: 'eof', value: '', start: this.#length, end: this.#length };
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
   *
   * @returns The next character in the expression.
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
        // TODO: see if we can pass a message to the Lexer.#consumeUntil() call
        // @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/lexer.py#L151
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
   * TODO: write docs for Lexer.#consumeLiteral()
   *
   * @returns
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
      // TODO: see if we can get the error message from JSON.parse() and use that
      // @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/lexer.py#L174
      throw new LexerError(start, lexeme);
    }
  }

  /**
   * TODO: write docs for Lexer.#consumeQuotedIdentifier()
   *
   * @returns
   */
  #consumeQuotedIdentifier(): Token {
    const start = this.#position;
    const lexeme = '"' + this.#consumeUntil('"') + '"';
    try {
      const tokenLen = this.#position - start;

      return {
        type: 'quoted_identifier',
        value: JSON.parse(lexeme),
        start,
        end: tokenLen,
      };
    } catch (error) {
      // TODO: see if we can get the error message from JSON.parse() and use that
      // @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/lexer.py#L187
      // const errorMessage = `Invalid quoted identifier: ${lexeme}`;
      throw new LexerError(start, lexeme);
    }
  }

  /**
   * TODO: write docs for Lexer.#consumeRawStringLiteral()
   *
   * @returns
   */
  #consumeRawStringLiteral(): Token {
    const start = this.#position;
    const lexeme = this.#consumeUntil('"').replace(`\\'`, `'`);
    const tokenLen = this.#position - start;

    return {
      type: 'literal',
      value: lexeme,
      start,
      end: tokenLen,
    };
  }

  /**
   * TODO: write docs for Lexer.#matchOrElse()
   *
   * @param expected
   * @param matchType
   * @param elseType
   * @returns
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

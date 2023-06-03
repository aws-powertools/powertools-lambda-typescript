import { BINDING_POWER } from './constants';
import { field, literal } from './ast';
import { Lexer } from './Lexer';
import { ParsedResult } from './ParsedResult';
import { LexerError, IncompleteExpressionError, ParseError } from './errors';
/**
 * Top down operaotr precedence parser for JMESPath.
 *
 * ## References
 * The implementation of this Parser is based on the implementation of
 * [jmespath.py](https://github.com/jmespath/jmespath.py/), which in turn
 * is based on [Vaughan R. Pratt's "Top Down Operator Precedence"](http://dl.acm.org/citation.cfm?doid=512927.512931).
 *
 * If you don't want to read the full paper, there are some other good
 * overviews that explain the general idea:
 * - [Pratt Parsers: Expression Parsing Made Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/)
 * - [Simple Top-Down Parsing in Python](http://effbot.org/zone/simple-top-down-parsing.htm)
 * - [Top Down Operator Precedence](http://javascript.crockford.com/tdop/tdop.html)
 */
class Parser {
  #bindingPowers: typeof BINDING_POWER = BINDING_POWER;
  /**
   * The maximum binding power for a token
   * that can stop a projection.
   */
  #projectionStop = 10;
  /**
   * Cache object
   */
  #cache: Record<string, ParsedResult> = {};
  /**
   * The maximum size of the cache.
   */
  #maxCacheSize = 128;
  #tokenizer?: Lexer;
  #tokens: unknown[];
  #bufferSize: number;
  #index = 0;

  public constructor(lookahead = 2) {
    this.#tokens = Array.from({ length: lookahead });
    this.#bufferSize = lookahead;
  }

  /**
   * TODO: write docs for Parser.parse()
   *
   * @param expression The JMESPath expression to parse.
   * @returns The parsed expression.
   */
  public parse(expression: string): ParsedResult {
    const cached = this.#cache[expression];
    if (cached) {
      return cached;
    }
    const parsedResult = this.#doParse(expression);
    this.#cache[expression] = parsedResult;
    if (Object.keys(this.#cache).length > this.#maxCacheSize) {
      this.#evictCache();
    }

    return parsedResult;
  }

  /**
   * TODO: write docs for Parser.#doParse()
   *
   * @param expression The JMESPath expression to parse.
   * @returns The parsed expression.
   */
  #doParse(expression: string): ParsedResult {
    try {
      return this.#parse(expression);
    } catch (error) {
      if (error instanceof LexerError) {
        error.expression = expression;
        throw error;
      } else if (error instanceof IncompleteExpressionError) {
        error.expression = expression;
        throw error;
      } else if (error instanceof ParseError) {
        error.expression = expression;
        throw error;
      } else {
        throw error;
      }
    }
  }

  /**
   * TODO: write docs for Parser.#parse()
   */
  #parse(expression: string): ParsedResult {
    this.#tokenizer = new Lexer();
    this.#tokens = this.#tokenizer.tokenize(expression);
    this.#index = 0;
    const parsed = this.#expression(0);
    if (this.#currentToken() !== 'eof') {
      const token = this.#lookaheadToken(0);
      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
      });
    }

    return new ParsedResult(expression, parsed);
  }

  /**
   * TODO: write docs for Parser.#expression()
   */
  #expression(bindingPower: number): unknown {
    const leftToken = this.#lookaheadToken(0);
    this.#advance();
    const nudFunction = this.#getNudFunction(leftToken.type);
    let left = nudFunction(leftToken);
    let currentToken = this.#currentToken();
    while (bindingPower < this.#bindingPowers[currentToken]) {
      const ledFunction = this.#getLedFunction(currentToken);
      this.#advance();
      left = ledFunction(left);
      currentToken = this.#currentToken();
    }

    return left;
  }

  /**
   * TODO: write docs for arser.#advance()
   * TODO: complete `Parser.#getNudFunction()` implementation using `ast.tokenType`
   * @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/parser.py#L121-L123
   * @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/parser.py#L137-L138
   *
   * @param tokenType The type of token to get the nud function for.
   * @returns not sure
   */
  #getNudFunction(token: unknown): unknown {
    if (token.type === 'literal') {
      return literal(token.value);
    } else if (token.type === 'unquoted_identifier') {
      return field(token.value);
    } else if (token.type === 'quoted_identifier') {
      const fieldValue = field(token.value);
      // You can't have a quoted identifier as a function name
      if (this.#currentToken() === 'lparen') {
        const token = this.#lookaheadToken(0);
        throw new ParseError({
          lexPosition: 0,
          tokenValue: token.value,
          tokenType: token.type,
          reason: 'Quoted identifier cannot be used as a function name',
        });
      }

      return fieldValue;
    } else if ()
    else {
      if (token.type === 'eof') {
        throw new ParseError({
          lexPosition: token.start,
          tokenValue: token.value,
          tokenType: token.type,
          reason: 'invalid token',
        });
      }
    }
  }

  #ledFunction(token: unknown): unknown {
    const method = `#led${token.type}`;
    if (!method) {
      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
        reason: 'invalid token',
      });
    }

    return this[method];
  }
}

export { Parser };

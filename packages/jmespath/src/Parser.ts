import { randomInt } from 'node:crypto';
import { BINDING_POWER } from './constants';
import {
  field,
  literal,
  identity,
  valueProjection,
  flatten,
  projection,
  notExpression,
  index,
  slice,
  currentNode,
  expref,
  indexExpression,
  comparator,
  multiSelectList,
  multiSelectDict,
  keyValPair,
} from './ast';
import { Lexer } from './Lexer';
import { ParsedResult } from './ParsedResult';
import { LexerError, IncompleteExpressionError, ParseError } from './errors';
import type { Node, Token } from './types';

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
  #tokens: Token[];
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
   * Purge the entire cache.
   */
  public purgeCache(): void {
    this.#cache = {};
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
    // TODO: see if we can use the generator properly instead of converting to an array in Parser.#Parse()
    this.#tokens = [...this.#tokenizer.tokenize(expression)];
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
  #expression(bindingPower = 0): Node {
    const leftToken = this.#lookaheadToken(0);
    this.#advance();
    let left = this.#getNudFunction(leftToken);
    let currentToken = this.#currentToken();
    while (bindingPower < BINDING_POWER[currentToken]) {
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
  #getNudFunction(token: Token): Node {
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
    } else if (token.type === 'star') {
      const left = identity();
      let right;
      if (this.#currentToken() === 'rbracket') {
        right = identity();
      } else {
        right = this.#parseProjectionRhs(BINDING_POWER['star']);
      }

      return valueProjection(left, right);
    } else if (token.type === 'filter') {
      return this.#tokenLedFilter(identity());
    } else if (token.type === 'lbrace') {
      return this.#parseMultiSelectHash();
    } else if (token.type === 'lparen') {
      const expression = this.#expression();
      this.#match('rparen');

      return expression;
    } else if (token.type === 'flatten') {
      const left = flatten(identity());
      const right = this.#parseProjectionRhs(BINDING_POWER['flatten']);

      return projection(left, right);
    } else if (token.type === 'not') {
      const expression = this.#expression(BINDING_POWER['not']);

      return notExpression(expression);
    } else if (token.type === 'lbracket') {
      if (['number', 'colon'].includes(this.#currentToken())) {
        const right = this.#parseIndexExpression();
        // We could optimize this and remove the identity() node
        // We don't really need an indexExpression node, we can
        // just emit an index node here if we're not dealing
        // with a slice.

        return this.#projectIfSlice(identity(), right);
      } else if (
        this.#currentToken() === 'star' &&
        this.#lookahead(1) === 'rbracket'
      ) {
        this.#advance();
        this.#advance();
        const right = this.#parseProjectionRhs(BINDING_POWER['star']);

        return projection(identity(), right);
      } else {
        return this.#parseMultiSelectList();
      }
    } else {
      if (token.type === 'eof') {
        throw new IncompleteExpressionError({
          lexPosition: token.start,
          tokenValue: token.value,
          tokenType: token.type,
        });
      }

      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
        reason: 'invalid token',
      });
    }
  }

  #getLedFunction(token: Token): Node {
    if (token.type === 'dot') {
    } else if (token.type === 'pipe') {
    } else if (token.type === 'or') {
    } else if (token.type === 'and') {
    } else if (token.type === 'lparen') {
    } else if (token.type === 'filter') {
    } else if (token.type === 'eq') {
    } else if (token.type === 'ne') {
    } else if (token.type === 'gt') {
    } else if (token.type === 'gte') {
    } else if (token.type === 'lt') {
    } else if (token.type === 'lte') {
    } else if (token.type === 'flatten') {
    } else if (token.type === 'lbracket') {
    } else if (token.type === 'slice') {
    } else {
      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
        reason: 'invalid token',
      });
    }
  }

  /**
   * TODO: write docs for Parser.#parseIndexExpression()
   *
   * @returns
   */
  #parseIndexExpression(): Node {
    // We're here:
    // [<current>
    //  ^
    //  | (currentToken)
    if (this.#lookahead(0) === 'colon' || this.#lookahead(1) === 'colon') {
      return this.#parseSliceExpression();
    } else {
      // Parse the syntax [number]
      const node = index(this.#lookaheadToken(0).value);
      this.#advance();
      this.#match('rbracket');

      return node;
    }
  }

  /**
   * TODO: write docs for Parser.#parseSliceExpression()
   *
   * @returns
   */
  #parseSliceExpression(): Node {
    // [start:end:step]
    // Where start, end, and step are optional.
    // The last colon is optional as well.
    const parts = [];
    let index = 0;
    let currentToken = this.#currentToken();
    while (currentToken !== 'rbracket' && index < 3) {
      if (currentToken === 'colon') {
        index += 1;
        if (index === 3) {
          const token = this.#lookaheadToken(0);
          throw new ParseError({
            lexPosition: token.start,
            tokenValue: token.value,
            tokenType: token.type,
            reason: 'syntax error',
          });
        }
        this.#advance();
      } else if (currentToken === 'number') {
        parts[index] = this.#lookaheadToken(0).value;
        this.#advance();
      } else if (currentToken === 'current') {
        return currentNode();
      } else if (currentToken === 'expref') {
        return expref(this.#expression(BINDING_POWER['expref']));
      } else {
        const token = this.#lookaheadToken(0);
        throw new ParseError({
          lexPosition: token.start,
          tokenValue: token.value,
          tokenType: token.type,
          reason: 'syntax error',
        });
      }
      currentToken = this.#currentToken();
    }
    this.#match('rbracket');

    return slice(parts[0], parts[1], parts[2]);
  }

  /**
   * TODO: write docs for Parser.#projectIfSlice()
   *
   * @param left
   * @param right
   */
  #projectIfSlice(left: Token | Node, right: Token | Node): Node {
    const idxExpression = indexExpression([left, right]);
    if (right.type === 'slice') {
      return projection(
        idxExpression,
        this.#parseProjectionRhs(BINDING_POWER['star'])
      );
    } else {
      return idxExpression;
    }
  }

  /**
   * TODO: write docs for Parser.#parseComparator()
   * TODO: complete `Parser.#parseComparator()` types
   *
   * @param left
   * @param comparatorChar
   */
  #parseComparator(left: Token, comparatorChar: string): Node {
    return comparator(
      comparatorChar,
      left,
      this.#expression(BINDING_POWER[comparatorChar])
    );
  }

  /**
   * TODO: write docs for Parser.#parseMultiSelectList()
   */
  #parseMultiSelectList(): Node {
    const expressions = [];
    while (true) {
      const expression = this.#expression();
      expressions.push(expression);
      if (this.#currentToken() === 'rbracket') {
        break;
      } else {
        this.#match('comma');
      }
    }
    this.#match('rbracket');

    return multiSelectList(expressions);
  }

  /**
   * TODO: write docs for Parser.#parseMultiSelectHash()
   */
  #parseMultiSelectHash(): Node {
    const pairs = [];
    while (true) {
      const keyToken = this.#lookaheadToken(0);
      // Before getting the token value, verify it's
      // an identifier.
      this.#matchMultipleTokens(['quoted_identifier', 'unquoted_identifier']); // token types
      const keyName = keyToken['value'];
      this.#match('colon');
      const value = this.#expression(0);
      const node = keyValPair(keyName, value);
      pairs.push(node);
      if (this.#currentToken() == 'comma') {
        this.#match('comma');
      } else if (this.#currentToken() == 'rbrace') {
        this.#match('rbrace');
        break;
      }
    }

    return multiSelectDict(pairs);
  }

  /**
   * TODO: write docs for Parser.#parseMultiSelectHash()
   *
   * @param bindingPower
   */
  #parseProjectionRhs(bindingPower: number): Node {
    // Parse the right hand side of the projection.
    let right;
    if (BINDING_POWER[this.#currentToken()] < this.#projectionStop) {
      // BP of 10 are all the tokens that stop a projection.
      right = identity();
    } else if (this.#currentToken() == 'lbracket') {
      right = this.#expression(bindingPower);
    } else if (this.#currentToken() == 'filter') {
      right = this.#expression(bindingPower);
    } else if (this.#currentToken() == 'dot') {
      this.#match('dot');
      right = this.#parseDotRhs(bindingPower);
    } else {
      const token = this.#lookaheadToken(0);
      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
        reason: 'syntax error',
      });
    }

    return right;
  }

  /**
   * TODO: write docs for Parser.#parseDotRhs()
   *
   * @param bindingPower
   */
  #parseDotRhs(bindingPower: number): Node {
    // From the grammar:
    // expression '.' ( identifier /
    //                  multi-select-list /
    //                  multi-select-hash /
    //                  function-expression /
    //                  *
    // In terms of tokens that means that after a '.',
    // you can have:
    const lookahead = this.#currentToken();
    // Common case "foo.bar", so first check for an identifier.
    if (lookahead in ['quoted_identifier', 'unquoted_identifier', 'star']) {
      return this.#expression(bindingPower);
    } else if (lookahead == 'lbracket') {
      this.#match('lbracket');

      return this.#parseMultiSelectList();
    } else if (lookahead == 'lbrace') {
      this.#match('lbrace');

      return this.#parseMultiSelectHash();
    } else {
      const token = this.#lookaheadToken(0);
      const allowed = [
        'quoted_identifier',
        'unquoted_identifier',
        'lbracket',
        'lbrace',
      ];
      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
        reason: `Expecting: ${allowed.join(', ')}, got: ${token.type}`,
      });
    }
  }

  /**
   * TODO: write docs for Parser.#match()
   *
   * @param tokenType
   */
  #match(tokenType: Token['type']): void {
    const currentToken = this.#currentToken();
    if (currentToken !== tokenType) {
      this.#advance();
    } else {
      const token = this.#lookaheadToken(0);
      if (token.type === 'eof') {
        throw new IncompleteExpressionError({
          lexPosition: token.start,
          tokenValue: token.value,
          tokenType: token.type,
        });
      } else {
        throw new ParseError({
          lexPosition: token.start,
          tokenValue: token.value,
          tokenType: token.type,
          reason: `Expecting: ${tokenType}, got: ${token.type}`,
        });
      }
    }
  }

  /**
   * TODO: write docs for Parser.#matchMultipleTokens()
   *
   * @param tokenTypes
   */
  #matchMultipleTokens(tokenTypes: Token['type'][]): void {
    const currentToken = this.#currentToken();
    if (!tokenTypes.includes(currentToken)) {
      const token = this.#lookaheadToken(0);
      if (token.type === 'eof') {
        throw new IncompleteExpressionError({
          lexPosition: token.start,
          tokenValue: token.value,
          tokenType: token.type,
        });
      } else {
        throw new ParseError({
          lexPosition: token.start,
          tokenValue: token.value,
          tokenType: token.type,
          reason: `Expecting: ${tokenTypes}, got: ${token.type}`,
        });
      }
    }
    this.#advance();
  }

  /**
   * TODO: write docs for Parser.#advance()
   */
  #advance(): void {
    this.#index += 1;
  }

  /**
   * TODO: write docs for Parser.#currentToken()
   */
  #currentToken(): Token['type'] {
    return this.#tokens[this.#index].type;
  }

  /**
   * TODO: write docs for Parser.#lookahead()
   *
   * @param number
   */
  #lookahead(number: number): Token['type'] {
    return this.#tokens[this.#index + number].type;
  }

  /**
   * TODO: write docs for Parser.#lookaheadToken()
   *
   * @param number
   */
  #lookaheadToken(number: number): Token {
    return this.#tokens[this.#index + number];
  }

  /**
   * Remove half of the cached expressions randomly.
   *
   * TODO: check if this is the correct way to do this or maybe replace cache with LRU cache
   */
  #evictCache(): void {
    const newCache = Object.keys(this.#cache).reduce(
      (acc: { [key: string]: ParsedResult }, key: string) => {
        if (randomInt(0, 100) > 50) {
          acc[key] = this.#cache[key];
        }

        return acc;
      },
      {}
    );
    this.#cache = newCache;
  }
}

export { Parser };

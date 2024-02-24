import { randomInt } from 'node:crypto';
import { Lexer } from './Lexer.js';
import { ParsedResult } from './ParsedResult.js';
import {
  andExpression,
  comparator,
  currentNode,
  expref,
  field,
  filterProjection,
  flatten,
  functionExpression,
  identity,
  index,
  indexExpression,
  keyValPair,
  literal,
  multiSelectObject,
  multiSelectList,
  notExpression,
  orExpression,
  pipe,
  projection,
  slice,
  subexpression,
  valueProjection,
} from './ast.js';
import { BINDING_POWER } from './constants.js';
import { IncompleteExpressionError, LexerError, ParseError } from './errors.js';
import type { Node, Token } from './types.js';

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
 * - [Simple Top-Down Parsing in Python](https://11l-lang.org/archive/simple-top-down-parsing/)
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
  #index = 0;

  public constructor(lookahead = 2) {
    this.#tokens = Array.from({ length: lookahead });
  }

  /**
   * Parse a JMESPath expression and return the Abstract Syntax Tree (AST)
   * that represents the expression.
   *
   * The AST is cached, so if you parse the same expression multiple times,
   * the AST will be returned from the cache.
   *
   * @param expression The JMESPath expression to parse.
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
   * Do the actual parsing of the expression.
   *
   * @param expression The JMESPath expression to parse.
   */
  #doParse(expression: string): ParsedResult {
    try {
      return this.#parse(expression);
    } catch (error) {
      if (
        error instanceof LexerError ||
        error instanceof IncompleteExpressionError ||
        error instanceof ParseError
      ) {
        error.setExpression(expression);
        throw error;
      }

      throw error;
    }
  }

  /**
   * Parse a JMESPath expression and return the parsed result.
   */
  #parse(expression: string): ParsedResult {
    this.#tokenizer = new Lexer();
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
   * Process an expression.
   */
  #expression(bindingPower = 0): Node {
    const leftToken = this.#lookaheadToken(0);
    this.#advance();
    let left = this.#getNudFunction(leftToken);
    let currentToken = this.#currentToken();
    while (bindingPower < BINDING_POWER[currentToken]) {
      this.#advance();
      left = this.#getLedFunction(currentToken, left);
      currentToken = this.#currentToken();
    }

    return left;
  }

  /**
   * Get the nud function for a token. This is the function that
   * is called when a token is found at the beginning of an expression.
   *
   * @param tokenType The type of token to get the nud function for.
   */
  #getNudFunction(token: Token): Node {
    const { type: tokenType } = token;
    if (tokenType === 'literal') {
      return literal(token.value);
    } else if (tokenType === 'unquoted_identifier') {
      return field(token.value);
    } else if (tokenType === 'quoted_identifier') {
      const fieldValue = field(token.value);
      // You can't have a quoted identifier as a function name
      if (this.#currentToken() === 'lparen') {
        const token = this.#lookaheadToken(0);
        throw new ParseError({
          lexPosition: 0,
          tokenValue: token.value,
          tokenType: token.type,
          reason: 'quoted identifiers cannot be used as a function name',
        });
      }

      return fieldValue;
    } else if (tokenType === 'star') {
      const left = identity();
      let right;
      if (this.#currentToken() === 'rbracket') {
        right = identity();
      } else {
        right = this.#parseProjectionRhs(BINDING_POWER['star']);
      }

      return valueProjection(left, right);
    } else if (tokenType === 'filter') {
      return this.#getLedFunction(tokenType, identity());
    } else if (tokenType === 'lbrace') {
      return this.#parseMultiSelectHash();
    } else if (tokenType === 'lparen') {
      const expression = this.#expression();
      this.#match('rparen');

      return expression;
    } else if (tokenType === 'flatten') {
      const left = flatten(identity());
      const right = this.#parseProjectionRhs(BINDING_POWER['flatten']);

      return projection(left, right);
    } else if (tokenType === 'not') {
      const expression = this.#expression(BINDING_POWER['not']);

      return notExpression(expression);
    } else if (tokenType === 'lbracket') {
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
    } else if (tokenType === 'current') {
      return currentNode();
    } else if (tokenType === 'expref') {
      return expref(this.#expression(BINDING_POWER['expref']));
    } else {
      if (tokenType === 'eof') {
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
      });
    }
  }

  #getLedFunction(tokenType: Token['type'], leftNode: Node): Node {
    if (tokenType === 'dot') {
      if (this.#currentToken() !== 'star') {
        const right = this.#parseDotRhs(BINDING_POWER[tokenType]);
        if (leftNode.type === 'subexpression') {
          leftNode.children.push(right);

          return leftNode;
        } else {
          return subexpression([leftNode, right]);
        }
      } else {
        // We are creating a value projection
        this.#advance();
        const right = this.#parseProjectionRhs(BINDING_POWER[tokenType]);

        return valueProjection(leftNode, right);
      }
    } else if (tokenType === 'pipe') {
      const right = this.#expression(BINDING_POWER[tokenType]);

      return pipe(leftNode, right);
    } else if (tokenType === 'or') {
      const right = this.#expression(BINDING_POWER[tokenType]);

      return orExpression(leftNode, right);
    } else if (tokenType === 'and') {
      const right = this.#expression(BINDING_POWER[tokenType]);

      return andExpression(leftNode, right);
    } else if (tokenType === 'lparen') {
      const name = leftNode.value as string;
      const args = [];
      while (this.#currentToken() !== 'rparen') {
        const expression = this.#expression();
        if (this.#currentToken() === 'comma') {
          this.#match('comma');
        }
        args.push(expression);
      }
      this.#match('rparen');

      return functionExpression(name, args);
    } else if (tokenType === 'filter') {
      // Filters are projections
      const condition = this.#expression(0);
      this.#match('rbracket');
      let right: Node;
      if (this.#currentToken() === 'flatten') {
        right = identity();
      } else {
        right = this.#parseProjectionRhs(BINDING_POWER['flatten']);
      }

      return filterProjection(leftNode, right, condition);
    } else if (['eq', 'ne', 'gt', 'gte', 'lt', 'lte'].includes(tokenType)) {
      return this.#parseComparator(leftNode, tokenType);
    } else if (tokenType === 'flatten') {
      const left = flatten(leftNode);
      const right = this.#parseProjectionRhs(BINDING_POWER['flatten']);

      return projection(left, right);
    } else if (tokenType === 'lbracket') {
      const token = this.#lookaheadToken(0);
      if (['number', 'colon'].includes(token.type)) {
        const right = this.#parseIndexExpression();
        if (leftNode.type === 'index_expression') {
          // Optimization: if the left node is an index expression
          // we can avoid creating another node and instead just
          // add the right node as a child of the left node.
          leftNode.children.push(right);

          return leftNode;
        } else {
          return this.#projectIfSlice(leftNode, right);
        }
      } else {
        // We have a projection
        this.#match('star');
        this.#match('rbracket');
        const right = this.#parseProjectionRhs(BINDING_POWER['star']);

        return projection(leftNode, right);
      }
    } else {
      const token = this.#lookaheadToken(0);
      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
      });
    }
  }

  /**
   * Process an index expression.
   *
   * An index expression is a syntax that allows you to
   * access elements in a list or dictionary. For example
   * `foo[0]` accesses the first element in the list `foo`.
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
   * Process a slice expression.
   *
   * A slice expression is a syntax that allows you to
   * access a range of elements in a list. For example
   * `foo[0:10:2]` accesses every other element in the
   * list `foo` from index 0 to 10.
   *
   * In a slice expression, the first index represents the
   * start of the slice, the second index represents the
   * end of the slice, and the third index represents the
   * step.
   *
   * If the first index is omitted, it defaults to 0.
   * If the second index is omitted, it defaults to the
   * length of the list. If the third index is omitted, it
   * defaults to 1. If the last colon is omitted, it defaults
   * to a single index.
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
          });
        }
        this.#advance();
      } else if (currentToken === 'number') {
        parts[index] = this.#lookaheadToken(0).value;
        this.#advance();
      } else {
        const token = this.#lookaheadToken(0);
        throw new ParseError({
          lexPosition: token.start,
          tokenValue: token.value,
          tokenType: token.type,
        });
      }
      currentToken = this.#currentToken();
    }
    this.#match('rbracket');

    return slice(parts[0], parts[1], parts[2]);
  }

  /**
   * Process a projection if the right hand side of the
   * projection is a slice.
   *
   * @param left The left hand side of the projection.
   * @param right The right hand side of the projection.
   */
  #projectIfSlice(left: Node, right: Node): Node {
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
   * Process a comparator.
   *
   * A comparator is a syntax that allows you to compare
   * two values. For example `foo == bar` compares the
   * value of `foo` with the value of `bar`.
   *
   * @param left The left hand side of the comparator.
   * @param comparatorChar The comparator character.
   */
  #parseComparator(left: Node, comparatorChar: Token['type']): Node {
    return comparator(
      comparatorChar,
      left,
      this.#expression(BINDING_POWER[comparatorChar])
    );
  }

  /**
   * Process a multi-select list.
   *
   * A multi-select list is a syntax that allows you to
   * select multiple elements from a list. For example
   * `foo[*]` selects all elements in the list `foo`.
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
   * Process a multi-select hash.
   *
   * A multi-select hash is a syntax that allows you to
   * select multiple key-value pairs from a dictionary.
   * For example `foo{a: a, b: b}` selects the keys `a`
   * and `b` from the dictionary `foo`.
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

    return multiSelectObject(pairs);
  }

  /**
   * Process the right hand side of a projection.
   *
   * @param bindingPower The binding power of the current token.
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
      });
    }

    return right;
  }

  /**
   * Process the right hand side of a dot expression.
   *
   * @param bindingPower The binding power of the current token.
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
    if (
      ['quoted_identifier', 'unquoted_identifier', 'star'].includes(lookahead)
    ) {
      return this.#expression(bindingPower);
    } else if (lookahead == 'lbracket') {
      this.#match('lbracket');

      return this.#parseMultiSelectList();
    } else if (lookahead == 'lbrace') {
      this.#match('lbrace');

      return this.#parseMultiSelectHash();
    } else {
      const token = this.#lookaheadToken(0);
      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
      });
    }
  }

  /**
   * Process a token and throw an error if it doesn't match the expected token.
   *
   * @param tokenType The expected token type.
   */
  #match(tokenType: Token['type']): void {
    const currentToken = this.#currentToken();
    if (currentToken === tokenType) {
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
        });
      }
    }
  }

  /**
   * Process a token and throw an error if it doesn't match the expected token.
   *
   * @param tokenTypes The expected token types.
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
        });
      }
    }
    this.#advance();
  }

  /**
   * Advance the index to the next token.
   */
  #advance(): void {
    this.#index += 1;
  }

  /**
   * Get the current token type.
   */
  #currentToken(): Token['type'] {
    return this.#tokens[this.#index].type;
  }

  /**
   * Look ahead in the token stream and get the type of the token
   *
   * @param number The number of tokens to look ahead.
   */
  #lookahead(number: number): Token['type'] {
    return this.#tokens[this.#index + number].type;
  }

  /**
   * Look ahead in the token stream and get the token
   *
   * @param number The number of tokens to look ahead.
   */
  #lookaheadToken(number: number): Token {
    return this.#tokens[this.#index + number];
  }

  /**
   * Remove half of the cached expressions randomly.
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

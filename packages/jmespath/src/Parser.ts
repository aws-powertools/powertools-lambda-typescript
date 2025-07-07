import { randomInt } from 'node:crypto';
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
  multiSelectList,
  multiSelectObject,
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
import { Lexer } from './Lexer.js';
import { ParsedResult } from './ParsedResult.js';
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
      this.#throwParseError();
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
    switch (tokenType) {
      case 'literal':
        return literal(token.value);
      case 'unquoted_identifier':
        return field(token.value);
      case 'quoted_identifier':
        return this.#processQuotedIdentifier(token);
      case 'star':
        return this.#processStarToken();
      case 'filter':
        return this.#getLedFunction(tokenType, identity());
      case 'lbrace':
        return this.#parseMultiSelectHash();
      case 'lparen':
        return this.#processLParenTokenNud();
      case 'flatten':
        return this.#processFlattenTokenNud();
      case 'not':
        return notExpression(this.#expression(BINDING_POWER.not));
      case 'lbracket':
        return this.#processLBracketTokenNud();
      case 'current':
        return currentNode();
      case 'expref':
        return expref(this.#expression(BINDING_POWER.expref));
      default:
        return this.#processDefaultToken(token);
    }
  }

  /**
   * Process a quoted identifier.
   *
   * A quoted identifier is a string that is enclosed in double quotes.
   *
   * @example s."foo"
   *
   * @param token The token to process
   */
  #processQuotedIdentifier(token: Token): Node {
    const fieldValue = field(token.value);
    if (this.#currentToken() === 'lparen') {
      this.#throwParseError({
        lexPosition: 0,
        reason: 'quoted identifiers cannot be used as a function name',
      });
    }

    return fieldValue;
  }

  /**
   * Process a star token.
   *
   * A star token is a syntax that allows you to project all the
   * elements in a list or dictionary.
   *
   * @example foo[*]
   */
  #processStarToken(): Node {
    const left = identity();
    let right: Node;
    if (this.#currentToken() === 'rbracket') {
      right = identity();
    } else {
      right = this.#parseProjectionRhs(BINDING_POWER.star);
    }

    return valueProjection(left, right);
  }

  /**
   * Process a left parenthesis token.
   *
   * A left parenthesis token is a syntax that allows you to group
   * expressions together.
   *
   * @example (foo.bar)
   */
  #processLParenTokenNud(): Node {
    const expression = this.#expression();
    this.#match('rparen');

    return expression;
  }

  /**
   * Process a flatten token.
   *
   * A flatten token is a syntax that allows you to flatten the
   * results of a subexpression.
   *
   * @example foo[].bar
   */
  #processFlattenTokenNud(): Node {
    const left = flatten(identity());
    const right = this.#parseProjectionRhs(BINDING_POWER.flatten);

    return projection(left, right);
  }

  /**
   * Process a left bracket token.
   *
   * A left bracket token is a syntax that allows you to access
   * elements in a list or dictionary.
   *
   * @example foo[0]
   */
  #processLBracketTokenNud(): Node {
    if (['number', 'colon'].includes(this.#currentToken())) {
      const right = this.#parseIndexExpression();

      return this.#projectIfSlice(identity(), right);
    }
    if (this.#currentToken() === 'star' && this.#lookahead(1) === 'rbracket') {
      this.#advance();
      this.#advance();
      const right = this.#parseProjectionRhs(BINDING_POWER.star);

      return projection(identity(), right);
    }
    return this.#parseMultiSelectList();
  }

  /**
   * Process a default token.
   *
   * A default token is a syntax that allows you to access
   * elements in a list or dictionary.
   *
   * @param token The token to process
   */
  #processDefaultToken(token: Token): Node {
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
    });
  }

  /**
   * Get the led function for a token. This is the function that
   * is called when a token is found in the middle of an expression.
   *
   * @param tokenType The type of token to get the led function for.
   * @param leftNode The left hand side of the expression.
   */
  #getLedFunction(tokenType: Token['type'], leftNode: Node): Node {
    switch (tokenType) {
      case 'dot':
        return this.#processDotToken(leftNode);
      case 'pipe':
        return this.#processPipeToken(leftNode);
      case 'or':
        return this.#processOrToken(leftNode);
      case 'and':
        return this.#processAndToken(leftNode);
      case 'lparen':
        return this.#processLParenToken(leftNode);
      case 'filter':
        return this.#processFilterToken(leftNode);
      case 'eq':
      case 'ne':
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
        return this.#parseComparator(leftNode, tokenType);
      case 'flatten':
        return this.#processFlattenToken(leftNode);
      case 'lbracket':
        return this.#processLBracketToken(leftNode);
      default:
        return this.#throwParseError();
    }
  }

  /**
   * Process a dot token.
   *
   * A dot token is a syntax that allows you to access
   * fields in a dictionary or elements in a list.
   *
   * @example foo.bar
   *
   * @param leftNode The left hand side of the expression.
   */
  #processDotToken(leftNode: Node): Node {
    if (this.#currentToken() !== 'star') {
      const right = this.#parseDotRhs(BINDING_POWER.dot);
      if (leftNode.type === 'subexpression') {
        leftNode.children.push(right);

        return leftNode;
      }
      return subexpression([leftNode, right]);
    }
    // We are creating a value projection
    this.#advance();
    const right = this.#parseProjectionRhs(BINDING_POWER.dot);

    return valueProjection(leftNode, right);
  }

  /**
   * Process a pipe token.
   *
   * A pipe token is a syntax that allows you to combine two
   * expressions using the pipe operator.
   *
   * @example foo | bar
   *
   * @param leftNode The left hand side of the expression.
   */
  #processPipeToken(leftNode: Node): Node {
    const right = this.#expression(BINDING_POWER.pipe);

    return pipe(leftNode, right);
  }

  /**
   * Process an or token.
   *
   * An or token is a syntax that allows you to combine two
   * expressions using the logical or operator.
   *
   * @example foo || bar
   *
   * @param leftNode The left hand side of the expression.
   */
  #processOrToken(leftNode: Node): Node {
    const right = this.#expression(BINDING_POWER.or);

    return orExpression(leftNode, right);
  }

  /**
   * Process an and token.
   *
   * An and token is a syntax that allows you to combine two
   * expressions using the logical and operator.
   *
   * @example foo && bar
   *
   * @param leftNode The left hand side of the expression.
   */
  #processAndToken(leftNode: Node): Node {
    const right = this.#expression(BINDING_POWER.and);

    return andExpression(leftNode, right);
  }

  #processLParenToken(leftNode: Node): Node {
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
  }

  #processFilterToken(leftNode: Node): Node {
    // Filters are projections
    const condition = this.#expression(0);
    this.#match('rbracket');
    let right: Node;
    if (this.#currentToken() === 'flatten') {
      right = identity();
    } else {
      right = this.#parseProjectionRhs(BINDING_POWER.flatten);
    }

    return filterProjection(leftNode, right, condition);
  }

  #processFlattenToken(leftNode: Node): Node {
    const left = flatten(leftNode);
    const right = this.#parseProjectionRhs(BINDING_POWER.flatten);

    return projection(left, right);
  }

  #processLBracketToken(leftNode: Node): Node {
    const token = this.#lookaheadToken(0);
    if (['number', 'colon'].includes(token.type)) {
      const right = this.#parseIndexExpression();
      if (leftNode.type === 'index_expression') {
        // Optimization: if the left node is an index expression
        // we can avoid creating another node and instead just
        // add the right node as a child of the left node.
        leftNode.children.push(right);

        return leftNode;
      }
      return this.#projectIfSlice(leftNode, right);
    }
    // We have a projection
    this.#match('star');
    this.#match('rbracket');
    const right = this.#parseProjectionRhs(BINDING_POWER.star);

    return projection(leftNode, right);
  }

  /**
   * Throw a parse error.
   *
   * This type of error indicates that the parser encountered
   * a syntax error while processing the expression.
   *
   * The error includes the position in the expression where
   * the error occurred, the value of the token that caused
   * the error, the type of the token, and an optional reason.
   *
   * @param options The options to use when throwing the error.
   */
  #throwParseError(options?: {
    lexPosition?: number;
    tokenValue?: Token['value'];
    tokenType?: Token['type'];
    reason?: string;
  }): never {
    const token = this.#lookaheadToken(0);
    throw new ParseError({
      lexPosition: options?.lexPosition ?? token.start,
      tokenValue: options?.tokenValue ?? token.value,
      tokenType: options?.tokenType ?? token.type,
      reason: options?.reason,
    });
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
    }
    // Parse the syntax [number]
    const node = index(this.#lookaheadToken(0).value);
    this.#advance();
    this.#match('rbracket');

    return node;
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
          this.#throwParseError();
        }
        this.#advance();
      } else if (currentToken === 'number') {
        parts[index] = this.#lookaheadToken(0).value;
        this.#advance();
      } else {
        this.#throwParseError();
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
        this.#parseProjectionRhs(BINDING_POWER.star)
      );
    }
    return idxExpression;
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
      }
      this.#match('comma');
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
      const keyName = keyToken.value;
      this.#match('colon');
      const value = this.#expression(0);
      const node = keyValPair(keyName, value);
      pairs.push(node);
      if (this.#currentToken() === 'comma') {
        this.#match('comma');
      } else if (this.#currentToken() === 'rbrace') {
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
    let right: Node;
    if (BINDING_POWER[this.#currentToken()] < this.#projectionStop) {
      // BP of 10 are all the tokens that stop a projection.
      right = identity();
    } else if (this.#currentToken() === 'lbracket') {
      right = this.#expression(bindingPower);
    } else if (this.#currentToken() === 'filter') {
      right = this.#expression(bindingPower);
    } else if (this.#currentToken() === 'dot') {
      this.#match('dot');
      right = this.#parseDotRhs(bindingPower);
    } else {
      this.#throwParseError();
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
    }
    if (lookahead === 'lbracket') {
      this.#match('lbracket');

      return this.#parseMultiSelectList();
    }
    if (lookahead === 'lbrace') {
      this.#match('lbrace');

      return this.#parseMultiSelectHash();
    }
    this.#throwParseError();
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
      }
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
      }
      throw new ParseError({
        lexPosition: token.start,
        tokenValue: token.value,
        tokenType: token.type,
      });
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

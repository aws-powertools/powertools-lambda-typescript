import {
  isIntegerNumber,
  isRecord,
  isStrictEqual,
} from '@aws-lambda-powertools/commons/typeutils';
import { Expression } from './Expression.js';
import { Functions } from './Functions.js';
import {
  ArityError,
  JMESPathError,
  JMESPathTypeError,
  UnknownFunctionError,
  VariadicArityError,
} from './errors.js';
import type { JMESPathParsingOptions, JSONObject, Node } from './types.js';
import { isTruthy, sliceArray } from './utils.js';

/**
 *
 * A tree interpreter for JMESPath ASTs.
 *
 * The tree interpreter is responsible for visiting nodes in the AST and
 * evaluating them to produce a result.
 *
 * @internal
 */
class TreeInterpreter {
  #functions: Functions;

  /**
   * @param options The options to use for the interpreter.
   */
  public constructor(options?: JMESPathParsingOptions) {
    if (options?.customFunctions) {
      this.#functions = options.customFunctions;
    } else {
      this.#functions = new Functions();
    }
    this.#functions.introspectMethods();
  }

  /**
   * Visit a node in the AST.
   *
   * The function will call the appropriate method to visit the node based on its type.
   *
   * @param node The node to visit.
   * @param value The current value to visit.
   */
  public visit(node: Node, value: JSONObject): JSONObject | null {
    const nodeType = node.type;
    const visitMethods: {
      [key: string]: (node: Node, value: JSONObject) => JSONObject | null;
    } = {
      subexpression: this.#visitSubexpressionOrIndexExpressionOrPipe,
      field: this.#visitField,
      comparator: this.#visitComparator,
      current: this.#visitCurrent,
      expref: this.#visitExpref,
      function_expression: this.#visitFunctionExpression,
      filter_projection: this.#visitFilterProjection,
      flatten: this.#visitFlatten,
      identity: this.#visitIdentity,
      index: this.#visitIndex,
      index_expression: this.#visitSubexpressionOrIndexExpressionOrPipe,
      slice: this.#visitSlice,
      key_val_pair: this.#visitKeyValPair,
      literal: this.#visitLiteral,
      multi_select_object: this.#visitMultiSelectObject,
      multi_select_list: this.#visitMultiSelectList,
      or_expression: this.#visitOrExpression,
      and_expression: this.#visitAndExpression,
      not_expression: this.#visitNotExpression,
      pipe: this.#visitSubexpressionOrIndexExpressionOrPipe,
      projection: this.#visitProjection,
      value_projection: this.#visitValueProjection,
    };

    const visitMethod = visitMethods[nodeType];
    if (visitMethod) {
      return visitMethod.call(this, node, value);
    }
    throw new JMESPathError(`Not Implemented: Invalid node type: ${node.type}`);
  }

  /**
   * Visit a subexpression, index expression, or pipe node.
   *
   * This method is shared between subexpression, index expression, and pipe
   * since they all behave the same way in the context of an expression.
   *
   * They all visit their children and return the result of the last child.
   *
   * @param node The node to visit.
   * @param value The current value to visit.
   */
  #visitSubexpressionOrIndexExpressionOrPipe(
    node: Node,
    value: JSONObject
  ): JSONObject {
    let result = value;
    for (const child of node.children) {
      result = this.visit(child, result);
    }

    return result;
  }
  /**
   * Visit a field node.
   *
   * @param node The field node to visit.
   * @param value The current value to visit.
   */
  #visitField(node: Node, value: JSONObject): JSONObject {
    if (!node.value) return null;
    if (
      isRecord(value) &&
      typeof node.value === 'string' &&
      node.value in value
    ) {
      return value[node.value] as JSONObject;
    }
    return null;
  }

  /**
   * Visit a comparator node.
   *
   * @param node The comparator node to visit.
   * @param value The current value to visit.
   */
  #visitComparator(node: Node, value: JSONObject): JSONObject {
    const comparator = node.value;
    const left = this.visit(node.children[0], value);
    const right = this.visit(node.children[1], value);
    if (
      typeof comparator === 'string' &&
      ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'].includes(comparator)
    ) {
      // Common cases: comparator is == or !=
      if (comparator === 'eq') {
        return isStrictEqual(left, right);
      }
      if (comparator === 'ne') {
        return !isStrictEqual(left, right);
      }
      if (typeof left === 'number' && typeof right === 'number') {
        // Ordering operators only work on numbers. Evaluating them on other
        // types will return null.
        if (comparator === 'lt') {
          return left < right;
        }
        if (comparator === 'lte') {
          return left <= right;
        }
        if (comparator === 'gt') {
          return left > right;
        }
        return left >= right;
      }
    } else {
      throw new JMESPathError(`Invalid comparator: ${comparator}`);
    }
  }

  /**
   * Visit a current node.
   *
   * @param node The current node to visit.
   * @param value The current value to visit.
   */
  #visitCurrent(_node: Node, value: JSONObject): JSONObject {
    return value;
  }

  /**
   * Visit an expref node.
   *
   * @param node The expref node to visit.
   * @param value The current value to visit.
   */
  #visitExpref(node: Node, _value: JSONObject): Expression {
    return new Expression(node.children[0], this);
  }

  /**
   * Visit a function expression node.
   *
   * @param node The function expression node to visit.
   * @param value The current value to visit.
   */
  #visitFunctionExpression(node: Node, value: JSONObject): JSONObject {
    const args = [];
    for (const child of node.children) {
      args.push(this.visit(child, value));
    }
    // check that method name is a string
    if (typeof node.value !== 'string') {
      throw new JMESPathError(
        `Function name must be a string, got ${node.value}`
      );
    }
    // convert snake_case to camelCase
    const normalizedFunctionName = node.value.replace(/_([a-z])/g, (g) =>
      g[1].toUpperCase()
    );
    // capitalize first letter & add `func` prefix
    const funcName = `func${
      normalizedFunctionName.charAt(0).toUpperCase() +
      normalizedFunctionName.slice(1)
    }`;
    if (!this.#functions.methods.has(funcName)) {
      throw new UnknownFunctionError(node.value);
    }

    try {
      // We know that methodName is a key of this.#functions, but TypeScript
      // doesn't know that, so we have to use @ts-ignore to tell it that it's
      // okay. We could use a type assertion like `as keyof Functions`, but
      // we also want to keep the args generic, so for now we'll just ignore it.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line
      return this.#functions[funcName](args);
    } catch (error) {
      if (
        error instanceof JMESPathTypeError ||
        error instanceof VariadicArityError ||
        error instanceof ArityError
      ) {
        error.setEvaluatedFunctionName(node.value);
        throw error;
      }
    }
  }

  /**
   * Visit a filter projection node.
   *
   * @param node The filter projection node to visit.
   * @param value The current value to visit.
   */
  #visitFilterProjection(node: Node, value: JSONObject): JSONObject {
    const base = this.visit(node.children[0], value);
    if (!Array.isArray(base)) {
      return null;
    }
    const comparatorNode = node.children[2];
    const collected = [];
    for (const item of base) {
      if (isTruthy(this.visit(comparatorNode, item))) {
        const current = this.visit(node.children[1], item);
        if (current !== null) {
          collected.push(current);
        }
      }
    }

    return collected;
  }

  /**
   * Visit a flatten node.
   *
   * @param node The flatten node to visit.
   * @param value The current value to visit.
   */
  #visitFlatten(node: Node, value: JSONObject): JSONObject {
    const base = this.visit(node.children[0], value);
    if (!Array.isArray(base)) {
      return null;
    }
    const mergedList = [];
    for (const item of base) {
      if (Array.isArray(item)) {
        mergedList.push(...item);
      } else {
        mergedList.push(item);
      }
    }

    return mergedList;
  }

  /**
   * Visit an identity node.
   *
   * @param node The identity node to visit.
   * @param value The current value to visit.
   */
  #visitIdentity(_node: Node, value: JSONObject): JSONObject {
    return value;
  }

  /**
   * Visit an index node.
   *
   * @param node The index node to visit.
   * @param value The current value to visit.
   */
  #visitIndex(node: Node, value: JSONObject): JSONObject {
    if (!Array.isArray(value)) {
      return null;
    }
    // The Python implementation doesn't support string indexing
    // even though we could, so we won't either for now.
    if (typeof node.value !== 'number') {
      throw new JMESPathError(`Invalid index: ${node.value}`);
    }
    const index = node.value < 0 ? value.length + node.value : node.value;
    const found = value[index];
    if (found === undefined) {
      return null;
    }

    return found;
  }

  /**
   * Visit a slice node.
   *
   * @param node The slice node to visit.
   * @param value The current value to visit.
   */
  #visitSlice(node: Node, value: JSONObject): JSONObject {
    const step = isIntegerNumber(node.children[2]) ? node.children[2] : 1;
    if (step === 0) {
      throw new Error('Invalid slice, step cannot be 0');
    }
    if (!Array.isArray(value)) {
      return null;
    }
    if (value.length === 0) {
      return [];
    }

    return sliceArray({
      array: value,
      start: node.children[0] as unknown as number,
      end: node.children[1] as unknown as number,
      step,
    });
  }

  /**
   * Visit a key-value pair node.
   *
   * @param node The key-value pair node to visit.
   * @param value The current value to visit.
   */
  #visitKeyValPair(node: Node, value: JSONObject): JSONObject {
    return this.visit(node.children[0], value);
  }

  /**
   * Visit a literal node.
   *
   * @param node The literal node to visit.
   * @param value The current value to visit.
   */
  #visitLiteral(node: Node, _value: JSONObject): JSONObject {
    return node.value;
  }

  /**
   * Visit a multi-select object node.
   *
   * @param node The multi-select object node to visit.
   * @param value The current value to visit.
   */
  #visitMultiSelectObject(node: Node, value: JSONObject): JSONObject {
    if (Object.is(value, null)) {
      return null;
    }
    const collected: Record<string, JSONObject> = {};
    for (const child of node.children) {
      if (typeof child.value === 'string') {
        collected[child.value] = this.visit(child, value);
      }
    }

    return collected;
  }

  /**
   * Visit a multi-select list node.
   *
   * @param node The multi-select list node to visit.
   * @param value The current value to visit.
   */
  #visitMultiSelectList(node: Node, value: JSONObject): JSONObject {
    if (Object.is(value, null)) {
      return null;
    }
    const collected = [];
    for (const child of node.children) {
      collected.push(this.visit(child, value));
    }

    return collected;
  }

  /**
   * Visit an or expression node.
   *
   * @param node The or expression node to visit.
   * @param value The current value to visit.
   */
  #visitOrExpression(node: Node, value: JSONObject): JSONObject {
    const matched = this.visit(node.children[0], value);
    if (!isTruthy(matched)) {
      return this.visit(node.children[1], value);
    }

    return matched;
  }

  /**
   * Visit an and expression node.
   *
   * @param node The and expression node to visit.
   * @param value The current value to visit.
   */
  #visitAndExpression(node: Node, value: JSONObject): JSONObject {
    const matched = this.visit(node.children[0], value);
    if (!isTruthy(matched)) {
      return matched;
    }

    return this.visit(node.children[1], value);
  }

  /**
   * Visit a not expression node.
   *
   * @param node The not expression node to visit.
   * @param value The current value to visit.
   */
  #visitNotExpression(node: Node, value: JSONObject): JSONObject {
    const originalResult = this.visit(node.children[0], value);
    if (typeof originalResult === 'number' && originalResult === 0) {
      // Special case for 0, !0 should be false, not true.
      // 0 is not a special cased integer in jmespath.
      return false;
    }

    return !isTruthy(originalResult);
  }

  /**
   * Visit a projection node.
   *
   * @param node The projection node to visit.
   * @param value The current value to visit.
   */
  #visitProjection(node: Node, value: JSONObject): JSONObject {
    const base = this.visit(node.children[0], value);
    if (!Array.isArray(base)) {
      return null;
    }
    const collected = [];
    for (const item of base) {
      const current = this.visit(node.children[1], item);
      if (current !== null) {
        collected.push(current);
      }
    }

    return collected;
  }

  /**
   * Visit a value projection node.
   *
   * @param node The value projection node to visit.
   * @param value The current value to visit.
   */
  #visitValueProjection(node: Node, value: JSONObject): JSONObject {
    const base = this.visit(node.children[0], value);
    if (!isRecord(base)) {
      return null;
    }
    const values = Object.values(base);
    const collected = [];
    for (const item of values) {
      const current = this.visit(node.children[1], item as JSONObject[]);
      if (current !== null) {
        collected.push(current);
      }
    }

    return collected;
  }
}

export { TreeInterpreter };

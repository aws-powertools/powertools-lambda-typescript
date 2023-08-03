import type { JSONValue, Node, TreeInterpreterOptions } from '../types';
import { Functions } from '../functions';
import { Expression, isRecord, isStrictEqual, isTruthy } from './utils';
import {
  ArityError,
  JMESPathTypeError,
  UnknownFunctionError,
  VariadicArityError,
} from '../errors';

class TreeInterpreter {
  #functions: Functions;

  /**
   * @param _options
   */
  public constructor(options?: TreeInterpreterOptions) {
    if (options?.customFunctions) {
      this.#functions = options.customFunctions;
    } else {
      this.#functions = new Functions();
    }
  }

  /**
   * TODO: write docs for TreeInterpreter.visit()
   * TODO: finalize types for TreeInterpreter.visit()
   *
   * @param node
   * @param value
   * @returns
   */
  public visit(node: Node, value: JSONValue): JSONValue | undefined {
    const nodeType = node.type;
    if (nodeType === 'subexpression') {
      return this.#visitSubexpression(node, value);
    } else if (nodeType === 'field') {
      return this.#visitField(node, value);
    } else if (nodeType === 'comparator') {
      return this.#visitComparator(node, value);
    } else if (nodeType === 'current') {
      return this.#visitCurrent(node, value);
    } else if (nodeType === 'expref') {
      // TODO: review #visitExpref() return type
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line
      return this.#visitExpref(node, value);
    } else if (nodeType === 'function_expression') {
      return this.#visitFunctionExpression(node, value);
    } else if (nodeType === 'filter_projection') {
      return this.#visitFilterProjection(node, value);
    } else if (nodeType === 'flatten') {
      return this.#visitFlatten(node, value);
    } else if (nodeType === 'identity') {
      return this.#visitIdentity(node, value);
    } else if (nodeType === 'index') {
      return this.#visitIndex(node, value);
    } else if (nodeType === 'index_expression') {
      return this.#visitIndexExpression(node, value);
      /* } else if (nodeType === 'slice') {
      return this.#visitSlice(node, value); */
    } else if (nodeType === 'key_val_pair') {
      return this.#visitKeyValPair(node, value);
    } else if (nodeType === 'literal') {
      return this.#visitLiteral(node, value);
    } else if (nodeType === 'multi_select_dict') {
      return this.#visitMultiSelectDict(node, value);
    } else if (nodeType === 'multi_select_list') {
      return this.#visitMultiSelectList(node, value);
    } else if (nodeType === 'or_expression') {
      return this.#visitOrExpression(node, value);
    } else if (nodeType === 'and_expression') {
      return this.#visitAndExpression(node, value);
    } else if (nodeType === 'not_expression') {
      return this.#visitNotExpression(node, value);
    } else if (nodeType === 'pipe') {
      return this.#visitPipe(node, value);
    } else if (nodeType === 'projection') {
      return this.#visitProjection(node, value);
    } else if (nodeType === 'value_projection') {
      return this.#visitValueProjection(node, value);
    } else {
      // TODO: convert to a custom error
      throw new Error(`Not Implemented: Invalid node type: ${node.type}`);
    }
  }

  /**
   * TODO: write docs for TreeInterpreter.visitSubexpression()
   * @param node
   * @param value
   * @returns
   */
  #visitSubexpression(node: Node, value: JSONValue): JSONValue {
    let result = value;
    for (const child of node.children) {
      result = this.visit(child, result);
    }

    return result;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitField()
   * @param node
   * @param value
   * @returns
   */
  #visitField(node: Node, value: JSONValue): JSONValue {
    if (!node.value) return null;
    if (
      isRecord(value) &&
      typeof node.value === 'string' &&
      node.value in value
    ) {
      return value[node.value];
    } else {
      return null;
    }
  }

  /**
   * TODO: write docs for TreeInterpreter.visitComparator()
   * @param node
   * @param value
   * @returns
   */
  #visitComparator(node: Node, value: JSONValue): JSONValue {
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
      } else if (comparator === 'ne') {
        return !isStrictEqual(left, right);
      } else if (typeof left === 'number' && typeof right === 'number') {
        // Ordering operators only work on numbers. Evaluating them on other
        // types will return null.
        if (comparator === 'lt') {
          return left < right;
        } else if (comparator === 'lte') {
          return left <= right;
        } else if (comparator === 'gt') {
          return left > right;
        } else {
          return left >= right;
        }
      } else {
        return null;
      }
    } else {
      // TODO: make invalid comparator a custom error
      throw new Error(`Invalid comparator: ${comparator}`);
    }
  }

  /**
   * TODO: write docs for TreeInterpreter.visitCurrent()
   * @param node
   * @param value
   * @returns
   */
  #visitCurrent(_node: Node, value: JSONValue): JSONValue {
    return value;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitExpref()
   * @param node
   * @param value
   * @returns
   */
  #visitExpref(node: Node, _value: JSONValue): Expression {
    return new Expression(node.children[0], this);
  }

  /**
   * TODO: write docs for TreeInterpreter.visitFunctionExpression()
   * @param node
   * @param value
   * @returns
   */
  #visitFunctionExpression(node: Node, value: JSONValue): JSONValue {
    const args = [];
    for (const child of node.children) {
      args.push(this.visit(child, value));
    }
    // check that method name is a string
    if (typeof node.value !== 'string') {
      throw new Error(`Function name must be a string, got ${node.value}`);
    }
    const methods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this.#functions)
    );
    // convert snake_case to camelCase
    const normalizedFunctionName = node.value.replace(/_([a-z])/g, (g) =>
      g[1].toUpperCase()
    );
    // capitalize first letter & add `func` prefix
    const funcName = `func${
      normalizedFunctionName.charAt(0).toUpperCase() +
      normalizedFunctionName.slice(1)
    }`;
    const methodName = methods.find((method) => method === funcName);
    if (!methodName) {
      throw new UnknownFunctionError();
    }

    try {
      // We know that methodName is a key of this.#functions, but TypeScript
      // doesn't know that, so we have to use @ts-ignore to tell it that it's
      // okay. We could use a type assertion like `as keyof Functions`, but
      // we also want to keep the args generic, so for now we'll just ignore it.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line
      return this.#functions[methodName](args);
    } catch (error) {
      if (
        error instanceof JMESPathTypeError ||
        error instanceof ArityError ||
        error instanceof VariadicArityError
      ) {
        error.setFunctionName(node.value);
        throw error;
      }
    }
  }

  /**
   * TODO: write docs for TreeInterpreter.visitFilterProjection()
   * @param node
   * @param value
   * @returns
   */
  #visitFilterProjection(node: Node, value: JSONValue): JSONValue {
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
   * TODO: write docs for TreeInterpreter.visitFlatten()
   * @param node
   * @param value
   * @returns
   */
  #visitFlatten(node: Node, value: JSONValue): JSONValue {
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
   * TODO: write docs for TreeInterpreter.visitIdentity()
   * @param node
   * @param value
   * @returns
   */
  #visitIdentity(_node: Node, value: JSONValue): JSONValue {
    return value;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitIndex()
   * @param node
   * @param value
   * @returns
   */
  #visitIndex(node: Node, value: JSONValue): JSONValue {
    // The Python implementation doesn't support string indexing
    // even though we could, so we won't either for now.
    if (!Array.isArray(value)) {
      return null;
    }
    if (typeof node.value !== 'number') {
      throw new Error(`Invalid index: ${node.value}`);
    }
    const index = node.value < 0 ? value.length + node.value : node.value;
    const found = value[index];
    if (found === undefined) {
      return null;
    }

    return found;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitIndexExpression()
   * @param node
   * @param value
   * @returns
   */
  #visitIndexExpression(node: Node, value: JSONValue): JSONValue {
    let result = value;
    for (const child of node.children) {
      result = this.visit(child, result);
    }

    return result;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitSlice()
   * @param node
   * @param value
   * @returns
   */
  /* #visitSlice(node: Node, value: JSONValue): JSONValue {
    
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitKeyValPair()
   * @param node
   * @param value
   * @returns
   */
  #visitKeyValPair(node: Node, value: JSONValue): JSONValue {
    return this.visit(node.children[0], value);
  }

  /**
   * TODO: write docs for TreeInterpreter.visitLiteral()
   * @param node
   * @param value
   * @returns
   */
  #visitLiteral(node: Node, _value: JSONValue): JSONValue {
    return node.value;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitMultiSelectDict()
   * @param node
   * @param value
   * @returns
   */
  #visitMultiSelectDict(node: Node, value: JSONValue): JSONValue {
    if (Object.is(value, null)) {
      return null;
    }
    const collected: JSONValue = {};
    for (const child of node.children) {
      if (typeof child.value === 'string') {
        collected[child.value] = this.visit(child, value);
      }
    }

    return collected;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitMultiSelectList()
   * @param node
   * @param value
   * @returns
   */
  #visitMultiSelectList(node: Node, value: JSONValue): JSONValue {
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
   * TODO: write docs for TreeInterpreter.visitOrExpression()
   * @param node
   * @param value
   * @returns
   */
  #visitOrExpression(node: Node, value: JSONValue): JSONValue {
    const matched = this.visit(node.children[0], value);
    if (!isTruthy(matched)) {
      return this.visit(node.children[1], value);
    }

    return matched;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitAndExpression()
   * @param node
   * @param value
   * @returns
   */
  #visitAndExpression(node: Node, value: JSONValue): JSONValue {
    const matched = this.visit(node.children[0], value);
    if (!isTruthy(matched)) {
      return matched;
    }

    return this.visit(node.children[1], value);
  }

  /**
   * TODO: write docs for TreeInterpreter.visitNotExpression()
   * @param node
   * @param value
   * @returns
   */
  #visitNotExpression(node: Node, value: JSONValue): JSONValue {
    const originalResult = this.visit(node.children[0], value);
    if (typeof originalResult === 'number' && originalResult === 0) {
      // Special case for 0, !0 should be false, not true.
      // 0 is not a special cased integer in jmespath.
      return false;
    }

    return !isTruthy(originalResult);
  }

  /**
   * TODO: write docs for TreeInterpreter.visitPipe()
   * @param node
   * @param value
   * @returns
   */
  #visitPipe(node: Node, value: JSONValue): JSONValue {
    let result = value;
    for (const child of node.children) {
      result = this.visit(child, result);
    }

    return result;
  }

  /**
   * TODO: write docs for TreeInterpreter.visitProjection()
   * @param node
   * @param value
   * @returns
   */
  #visitProjection(node: Node, value: JSONValue): JSONValue {
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
   * TODO: write docs for TreeInterpreter.visitValueProjection()
   * @param node
   * @param value
   * @returns
   */
  #visitValueProjection(node: Node, value: JSONValue): JSONValue {
    const base = this.visit(node.children[0], value);
    if (!isRecord(base)) {
      return null;
    }
    const values = Object.values(base);
    const collected = [];
    for (const item of values) {
      const current = this.visit(node.children[1], item);
      if (current !== null) {
        collected.push(current);
      }
    }

    return collected;
  }
}

export { TreeInterpreter };

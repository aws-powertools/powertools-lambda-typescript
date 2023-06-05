import type { JSONValue, Node, TreeInterpreterOptions } from '../types';
import { Functions } from '../functions';

/**
 * TODO: write docs for isRecord() type guard
 *
 * @param value
 * @returns
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    !Object.is(value, null)
  );
};

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
  public visit(node: Node, value: JSONValue): JSONValue {
    const nodeType = node.type;
    if (nodeType === 'subexpression') {
      return this.#visitSubexpression(node, value);
    } else if (nodeType === 'field') {
      return this.#visitField(node, value);
      /* } else if (nodeType === 'comparator') {
      return this.#visitComparator(node, value);
    } else if (nodeType === 'current') {
      return this.#visitCurrent(node, value);
    } else if (nodeType === 'expref') {
      return this.#visitExpref(node, value);
    } else if (nodeType === 'filter_projection') {
      return this.#visitFilterProjection(node, value); */
    } else if (nodeType === 'function_expression') {
      return this.#visitFunctionExpression(node, value);
    } else if (nodeType === 'current') {
      return this.#visitCurrent(node, value);
    } else if (nodeType === 'identity') {
      return this.#visitIdentity(node, value);
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

  /* #visitComparator(node: Node, value: JSONValue): JSONValue {
    return true;
  }
  */

  /**
   * TODO: write docs for TreeInterpreter.visitCurrent()
   * @param node
   * @param value
   * @returns
   */
  #visitCurrent(_node: Node, value: JSONValue): JSONValue {
    return value;
  }
  /*

  #visitExpref(node: Node, value: JSONValue): JSONValue {
    return true;
  }
  */

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
    const methods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(this.#functions)
    );
    const methodName = methods.find(
      (method) => method.replace('func', '').toLowerCase() === node.value
    );
    if (!methodName) {
      // TODO: convert to a custom error
      throw new Error(`Function not found: ${methodName}`);
    }

    // We know that methodName is a key of this.#functions, but TypeScript
    // doesn't know that, so we have to use @ts-ignore to tell it that it's
    // okay. We could use a type assertion like `as keyof Functions`, but
    // we also want to keep the args generic, so for now we'll just ignore it.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    return this.#functions[methodName](args);
  }

  /**
   * TODO: write docs for TreeInterpreter.visitIndex()
   * @param node
   * @param value
   * @returns
   */
  /* #visitFilterProjection(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitIndex()
   * @param node
   * @param value
   * @returns
   */
  /* #visitFlatten(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

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
  /* #visitIndex(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitIndexExpression()
   * @param node
   * @param value
   * @returns
   */
  /* #visitIndexExpression(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

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
  /* #visitKeyValPair(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitLiteral()
   * @param node
   * @param value
   * @returns
   */
  /* #visitLiteral(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitMultiSelectDict()
   * @param node
   * @param value
   * @returns
   */
  /* #visitMultiSelectDict(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitMultiSelectList()
   * @param node
   * @param value
   * @returns
   */
  /* #visitMultiSelectList(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitOrExpression()
   * @param node
   * @param value
   * @returns
   */
  /* #visitOrExpression(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitAndExpression()
   * @param node
   * @param value
   * @returns
   */
  /* #visitAndExpression(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitNotExpression()
   * @param node
   * @param value
   * @returns
   */
  /* #visitNotExpression(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitPipe()
   * @param node
   * @param value
   * @returns
   */
  /* #visitPipe(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitProjection()
   * @param node
   * @param value
   * @returns
   */
  /* #visitProjection(node: Node, value: JSONValue): JSONValue {
    return true;
  } */

  /**
   * TODO: write docs for TreeInterpreter.visitValueProjection()
   * @param node
   * @param value
   * @returns
   */
  /* #visitValueProjection(node: Node, value: JSONValue): JSONValue {
    const base = this.visit(node.children[0], value);
  } */
}

export { TreeInterpreter };

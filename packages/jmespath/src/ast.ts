import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { Node } from './types.js';

/**
 * AST node representing a comparator expression.
 *
 * A comparator expression is a binary expression that compares two values.
 *
 * @param name The name of the comparator
 * @param first The left-hand side of the comparator
 * @param second The right-hand side of the comparator
 */
const comparator = (name: string, first: Node, second: Node): Node => ({
  type: 'comparator',
  children: [first, second],
  value: name,
});

/**
 * AST node representing the current node.
 *
 * The current node is a reference to the current value being processed.
 * In JMESPath, the current node is represented by the `@` symbol.
 */
const currentNode = (): Node => ({
  type: 'current',
  children: [],
});

/**
 * AST node representing an expression reference.
 *
 * An expression reference is a reference to another expression.
 * In JMESPath, an expression reference is represented by the `&` symbol.
 *
 * @param expression The expression to reference
 */
const expref = (expression: Node): Node => ({
  type: 'expref',
  children: [expression],
});

/**
 * AST node representing a function expression.
 *
 * A function expression is a reference to a function and its arguments.
 * The JMESPath specification defines a set of built-in functions that can
 * be used in expressions like `length(@)`, `map(@, &foo)`, etc.
 *
 * Custom functions can be added by extending the `Functions` class.
 *
 * @param name The name of the function
 * @param args The arguments to the function
 */
const functionExpression = (name: string, args: Node[]): Node => ({
  type: 'function_expression',
  children: args,
  value: name,
});

/**
 * AST node representing a field reference.
 *
 * A field reference is a reference to a field in an object.
 */
const field = (name: JSONValue): Node => ({
  type: 'field',
  children: [],
  value: name,
});

/**
 * AST node representing a filter projection.
 *
 * A filter projection is a binary expression that filters the left-hand side
 * based on the right-hand side.
 *
 * In JMESPath, a filter projection is represented by the `[]` operator.
 * For example, `people[?age > 18]` filters the `people` array based on the
 * `age` field.
 *
 * @param left The left-hand side of the filter projection
 * @param right The right-hand side of the filter projection
 * @param comparator The comparator to use for the filter
 */
const filterProjection = (left: Node, right: Node, comparator: Node): Node => ({
  type: 'filter_projection',
  children: [left, right, comparator],
});

/**
 * AST node representing a flatten expression.
 *
 * A flatten expression is a unary expression that flattens an array of arrays
 * into a single array.
 *
 * In JMESPath, a flatten expression is represented by the `[]` operator.
 * For example, `people[].name` flattens the `people` array and returns the
 * `name` field of each object in the array.
 *
 * @param node The node to flatten
 */
const flatten = (node: Node): Node => ({
  type: 'flatten',
  children: [node],
});

/**
 * AST node representing an identity expression.
 */
const identity = (): Node => ({ type: 'identity', children: [] });

/**
 * AST node representing an index reference.
 *
 * An index reference is a reference to an index in an array.
 * For example, `people[0]` references the first element in the `people` array.
 *
 * @param index The index to reference
 */
const index = (index: JSONValue): Node => ({
  type: 'index',
  value: index,
  children: [],
});

/**
 * AST node representing an index expression.
 *
 * An index expression holds the index and the children of the expression.
 *
 * @param children The children of the index expression
 */
const indexExpression = (children: Node[]): Node => ({
  type: 'index_expression',
  children: children,
});

/**
 * AST node representing a key-value pair.
 *
 * @param keyName The name of the key
 * @param node The value of the key
 */
const keyValPair = (keyName: JSONValue, node: Node): Node => ({
  type: 'key_val_pair',
  children: [node],
  value: keyName,
});

/**
 * AST node representing a literal value.
 *
 * A literal value is a value that is not a reference to another node.
 *
 * @param literalValue The value of the literal
 */
const literal = (literalValue: JSONValue): Node => ({
  type: 'literal',
  value: literalValue,
  children: [],
});

/**
 * AST node representing a multi-select object.
 *
 * A multi-select object is a reference to multiple nodes in an object.
 *
 * @param nodes
 */
const multiSelectObject = (nodes: Node[]): Node => ({
  type: 'multi_select_object',
  children: nodes,
});

/**
 * AST node representing a multi-select list.
 *
 * @param nodes
 */
const multiSelectList = (nodes: Node[]): Node => ({
  type: 'multi_select_list',
  children: nodes,
});

/**
 * AST node representing an or expression.
 *
 * @param left The left-hand side of the or expression
 * @param right The right-hand side of the or expression
 */
const orExpression = (left: Node, right: Node): Node => ({
  type: 'or_expression',
  children: [left, right],
});

/**
 * AST node representing an and expression.
 *
 * @param left The left-hand side of the and expression
 * @param right The right-hand side of the and expression
 */
const andExpression = (left: Node, right: Node): Node => ({
  type: 'and_expression',
  children: [left, right],
});

/**
 * AST node representing a not expression.
 *
 * @param left The left-hand side of the not expression
 * @param right The right-hand side of the not expression
 */
const notExpression = (expr: Node): Node => ({
  type: 'not_expression',
  children: [expr],
});

/**
 * AST node representing a pipe expression.
 *
 * @param left The left-hand side of the pipe expression
 * @param right The right-hand side of the pipe expression
 */
const pipe = (left: Node, right: Node): Node => ({
  type: 'pipe',
  children: [left, right],
});

/**
 * AST node representing a projection.
 *
 * @param left The left-hand side of the projection
 * @param right The right-hand side of the projection
 */
const projection = (left: Node, right: Node): Node => ({
  type: 'projection',
  children: [left, right],
});

/**
 * AST node representing a subexpression.
 *
 * @param children The children of the subexpression
 */
const subexpression = (children: Node[]): Node => ({
  type: 'subexpression',
  children: children,
});

/**
 * AST node representing a slice.
 *
 * A slice is a reference to a range of values in an array.
 *
 * @param start The start of the slice
 * @param end The end of the slice
 * @param step The step of the slice
 */
const slice = (start: JSONValue, end: JSONValue, step: JSONValue): Node => ({
  type: 'slice',
  children: [start as Node, end as Node, step as Node],
});

/**
 * AST node representing a value projection.
 *
 * @param left The left-hand side of the value projection
 * @param right The right-hand side of the value projection
 */
const valueProjection = (left: Node, right: Node): Node => ({
  type: 'value_projection',
  children: [left, right],
});

export {
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
};

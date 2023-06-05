import type { JSONValue, Node } from './types';

/**
 * TODO: write docs for comparator()
 */
const comparator = (name: string, first: Node, second: Node): Node => ({
  type: 'comparator',
  children: [first, second],
  value: name,
});

/**
 * TODO: write docs for currentNode()
 */
const currentNode = (): Node => ({
  type: 'current',
  children: [],
});

/**
 * TODO: write docs for expref()
 */
const expref = (expression: Node): Node => ({
  type: 'expref',
  children: [expression],
});

/**
 * TODO: write docs for functionExpression()
 */
const functionExpression = (name: string, args: Node[]): Node => ({
  type: 'function_expression',
  children: args,
  value: name,
});

/**
 * TODO: write docs for field()
 */
const field = (name: JSONValue): Node => ({
  type: 'field',
  children: [],
  value: name,
});

/**
 * TODO: write docs for fieldExpression()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const filterProjection = (left: Node, right: Node, comparator: Node): Node => ({
  type: 'filter_projection',
  children: [left, right, comparator],
});

/**
 * TODO: write docs for flatten()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const flatten = (node: Node): Node => ({
  type: 'flatten',
  children: [node],
});

/**
 * TODO: write docs for identity()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const identity = (): Node => ({ type: 'identity', children: [] });

/**
 * TODO: write docs for index()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const index = (index: JSONValue): Node => ({
  type: 'index',
  value: index,
  children: [],
});

/**
 * TODO: write docs for indexExpression()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const indexExpression = (children: Node[]): Node => ({
  type: 'index_expression',
  children: children,
});

/**
 * TODO: write docs for keyValPair()
 *
 * @param keyName
 * @param node
 */
const keyValPair = (keyName: JSONValue, node: Node): Node => ({
  type: 'key_val_pair',
  children: [node],
  value: keyName,
});

/**
 * TODO: write docs for literal()
 *
 * @param literalValue
 */
const literal = (literalValue: JSONValue): Node => ({
  type: 'literal',
  value: literalValue,
  children: [],
});

/**
 * TODO: write docs for multiSelectDict()
 * TODO: check if multiSelectDict() could be possibly be renamed to multiSelectObject() / multiSelectMap() / multiSelectHash()
 *
 * @param nodes
 */
const multiSelectDict = (nodes: Node[]): Node => ({
  type: 'multi_select_dict',
  children: nodes,
});

/**
 * TODO: write docs for multiSelectList()
 * TODO: check if multiSelectList() could be possibly be renamed to multiSelectArray()
 *
 * @param nodes
 */
const multiSelectList = (nodes: Node[]): Node => ({
  type: 'multi_select_list',
  children: nodes,
});

/**
 * TODO: write docs for orExpression()
 * @param left
 * @param right
 */
const orExpression = (left: Node, right: Node): Node => ({
  type: 'or_expression',
  children: [left, right],
});

/**
 * TODO: write docs for andExpression()
 * @param left
 * @param right
 */
const andExpression = (left: Node, right: Node): Node => ({
  type: 'and_expression',
  children: [left, right],
});

/**
 * TODO: write docs for notExpression()
 * @param left
 * @param right
 */
const notExpression = (expr: Node): Node => ({
  type: 'not_expression',
  children: [expr],
});

/**
 * TODO: write docs for multiSelectList()
 * @param left
 * @param right
 */
const pipe = (left: Node, right: Node): Node => ({
  type: 'pipe',
  children: [left, right],
});

/**
 * TODO: write docs for projection()
 * @param left
 * @param right
 */
const projection = (left: Node, right: Node): Node => ({
  type: 'projection',
  children: [left, right],
});

/**
 * TODO: write docs for subexpression()
 * @param children
 */
const subexpression = (children: Node[]): Node => ({
  type: 'subexpression',
  children: children,
});

/**
 * TODO: write docs for slice()
 * TODO: fix type for slice()
 *
 * @param start
 * @param end
 * @param step
 */
const slice = (start: JSONValue, end: JSONValue, step: JSONValue): Node => ({
  type: 'slice',
  children: [start as Node, end as Node, step as Node],
});

/**
 * TODO: write docs for valueProjection()
 *
 * @param left
 * @param right
 */
const valueProjection = (left: Node, right: Node): Node => ({
  type: 'value_projection',
  children: [left, right],
});

export {
  comparator,
  currentNode,
  expref,
  functionExpression,
  field,
  filterProjection,
  flatten,
  identity,
  index,
  indexExpression,
  keyValPair,
  literal,
  multiSelectDict,
  multiSelectList,
  orExpression,
  andExpression,
  notExpression,
  pipe,
  projection,
  subexpression,
  slice,
  valueProjection,
};

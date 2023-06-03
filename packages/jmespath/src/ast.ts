/**
 * TODO: finalize ASTThing type & extract
 */
type ASTThing = {
  type: string;
  children: unknown[];
  value?: unknown;
};

/**
 * TODO: write docs for comparator()
 * TODO: finalize types for comparator()
 */
const comparator = (
  name: unknown,
  first: unknown,
  second: unknown
): ASTThing => ({
  type: 'comparator',
  children: [first, second],
  value: name,
});

/**
 * TODO: write docs for currentNode()
 * TODO: finalize types for currentNode()
 */
const currentNode = (): ASTThing => ({
  type: 'current',
  children: [],
});

/**
 * TODO: write docs for expref()
 * TODO: finalize types for expref()
 */
const expref = (expression: unknown): ASTThing => ({
  type: 'expref',
  children: [expression],
});

/**
 * TODO: write docs for functionExpression()
 * TODO: finalize types for functionExpression()
 */
const functionExpression = (name: unknown, args: unknown[]): ASTThing => ({
  type: 'function_expression',
  children: args,
  value: name,
});

/**
 * TODO: write docs for field()
 * TODO: finalize types for field()
 */
const field = (name: unknown): ASTThing => ({
  type: 'field',
  children: [],
  value: name,
});

/**
 * TODO: write docs for fieldExpression()
 * TODO: finalize types for fieldExpression()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const filterProjection = (
  left: unknown,
  right: unknown,
  comparator: unknown
): ASTThing => ({
  type: 'filter_projection',
  children: [left, right, comparator],
});

/**
 * TODO: write docs for flatten()
 * TODO: finalize types for flatten()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const flatten = (node: unknown): ASTThing => ({
  type: 'flatten',
  children: [node],
});

/**
 * TODO: write docs for identity()
 * TODO: finalize types for identity()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const identity = (): ASTThing => ({ type: 'identity', children: [] });

/**
 * TODO: write docs for index()
 * TODO: finalize types for index()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const index = (index: unknown): ASTThing => ({
  type: 'index',
  value: index,
  children: [],
});

/**
 * TODO: write docs for indexExpression()
 * TODO: finalize types for indexExpression()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const indexExpression = (children: unknown[]): ASTThing => ({
  type: 'index_expression',
  children: children,
});

/**
 * TODO: write docs for keyValPair()
 * TODO: finalize types for keyValPair()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const keyValPair = (keyName: string, node: unknown): ASTThing => ({
  type: 'key_val_pair',
  children: [node],
  value: keyName,
});

/**
 * TODO: write docs for literal()
 * TODO: finalize types for literal()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const literal = (literalValue: unknown): ASTThing => ({
  type: 'literal',
  value: literalValue,
  children: [],
});

/**
 * TODO: write docs for multiSelectDict()
 * TODO: finalize types for multiSelectDict()
 * TODO: check if multiSelectDict() could be possibly be renamed to multiSelectObject() / multiSelectMap() / multiSelectHash()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const multiSelectDict = (nodes: unknown[]): ASTThing => ({
  type: 'multi_select_dict',
  children: nodes,
});

/**
 * TODO: write docs for multiSelectList()
 * TODO: finalize types for multiSelectList()
 * TODO: check if multiSelectList() could be possibly be renamed to multiSelectArray()
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const multiSelectList = (nodes: unknown[]): ASTThing => ({
  type: 'multi_select_list',
  children: nodes,
});

/**
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const orExpression = (left: unknown, right: unknown): ASTThing => ({
  type: 'or_expression',
  children: [left, right],
});

/**
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const andExpression = (left: unknown, right: unknown): ASTThing => ({
  type: 'and_expression',
  children: [left, right],
});

/**
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const notExpression = (expr: unknown): ASTThing => ({
  type: 'not_expression',
  children: [expr],
});

/**
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const pipe = (left: unknown, right: unknown): ASTThing => ({
  type: 'pipe',
  children: [left, right],
});

/**
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const projection = (left: unknown, right: unknown): ASTThing => ({
  type: 'projection',
  children: [left, right],
});

/**
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const subexpression = (children: unknown[]): ASTThing => ({
  type: 'subexpression',
  children: children,
});

/**
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const slice = (start: unknown, end: unknown, step: unknown): ASTThing => ({
  type: 'slice',
  children: [start, end, step],
});

/**
 *
 * @param left
 * @param right
 * @param comparator
 * @returns
 */
const valueProjection = (left: unknown, right: unknown): ASTThing => ({
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

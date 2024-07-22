/**
 * The binding powers for the various tokens in the JMESPath grammar.
 *
 * The binding powers are used to determine the order of operations for
 * the parser. The higher the binding power, the more tightly the token
 * binds to its arguments.
 */
const BINDING_POWER = {
  eof: 0,
  unquoted_identifier: 0,
  quoted_identifier: 0,
  literal: 0,
  rbracket: 0,
  rparen: 0,
  comma: 0,
  rbrace: 0,
  number: 0,
  current: 0,
  expref: 0,
  colon: 0,
  pipe: 1,
  or: 2,
  and: 3,
  eq: 5,
  gt: 5,
  lt: 5,
  gte: 5,
  lte: 5,
  ne: 5,
  flatten: 9,
  // Everything above stops a projection.
  star: 20,
  filter: 21,
  dot: 40,
  not: 45,
  lbrace: 50,
  lbracket: 55,
  lparen: 60,
} as const;

/**
 * The set of ASCII lowercase letters allowed in JMESPath identifiers.
 */
const ASCII_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
/**
 * The set of ASCII uppercase letters allowed in JMESPath identifiers.
 */
const ASCII_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/**
 * The set of ASCII letters allowed in JMESPath identifiers.
 */
const ASCII_LETTERS = ASCII_LOWERCASE + ASCII_UPPERCASE;
/**
 * The set of ASCII digits allowed in JMESPath identifiers.
 */
const DIGITS = '0123456789';
/**
 * The set of ASCII letters and digits allowed in JMESPath identifiers.
 */
const START_IDENTIFIER = new Set(`${ASCII_LETTERS}_`);
/**
 * The set of ASCII letters and digits allowed in JMESPath identifiers.
 */
const VALID_IDENTIFIER = new Set(`${ASCII_LETTERS}${DIGITS}_`);
/**
 * The set of ASCII digits allowed in JMESPath identifiers.
 */
const VALID_NUMBER = new Set(DIGITS);
/**
 * The set of ASCII whitespace characters allowed in JMESPath identifiers.
 */
const WHITESPACE = new Set(' \t\n\r');
/**
 * The set of simple tokens in the JMESPath grammar.
 */
const SIMPLE_TOKENS: Map<string, keyof typeof BINDING_POWER> = new Map([
  ['.', 'dot'],
  ['*', 'star'],
  [':', 'colon'],
  [']', 'rbracket'],
  [',', 'comma'],
  [':', 'colon'],
  ['@', 'current'],
  ['(', 'lparen'],
  [')', 'rparen'],
  ['{', 'lbrace'],
  ['}', 'rbrace'],
]);

export {
  BINDING_POWER,
  SIMPLE_TOKENS,
  START_IDENTIFIER,
  VALID_IDENTIFIER,
  VALID_NUMBER,
  WHITESPACE,
};

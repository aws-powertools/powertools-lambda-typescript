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

const ASCII_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const ASCII_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ASCII_LETTERS = ASCII_LOWERCASE + ASCII_UPPERCASE;
const DIGITS = '0123456789';

const START_IDENTIFIER = new Set(ASCII_LETTERS + '_');
const VALID_IDENTIFIER = new Set(ASCII_LETTERS + DIGITS + '_');
const VALID_NUMBER = new Set(DIGITS);
const WHITESPACE = new Set(' \t\n\r');
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

/**
 * A map of JavaScript types to JMESPath types.
 */

export {
  BINDING_POWER,
  WHITESPACE,
  START_IDENTIFIER,
  VALID_IDENTIFIER,
  VALID_NUMBER,
  SIMPLE_TOKENS,
};

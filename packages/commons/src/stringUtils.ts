/**
 * Compares strings lexicographically by Unicode code point without normalization.
 *
 * Produces a negative number when the left string precedes the right string,
 * zero when they are equal, and a positive number when the left string follows.
 *
 * @param left - Supply the first string to compare
 * @param right - Supply the second string to compare
 * @example
 * ```typescript
 * import { compareStringsByCodePoint } from '@aws-lambda-powertools/commons';
 *
 * const order = compareStringsByCodePoint('\uFFFF', '😀');
 * // order < 0 because U+FFFF precedes U+1F600.
 * const sorted = ['😀', '\uFFFF'].sort(compareStringsByCodePoint);
 * // ['\uFFFF', '😀']
 * ```
 */
const compareStringsByCodePoint = (left: string, right: string): number => {
  let index = 0;
  while (index < left.length && index < right.length) {
    // The bounds above ensure both code points exist at this index.
    const leftCodePoint = left.codePointAt(index) as number;
    const rightCodePoint = right.codePointAt(index) as number;
    if (leftCodePoint !== rightCodePoint) {
      return leftCodePoint - rightCodePoint;
    }
    index += leftCodePoint > 0xffff ? 2 : 1;
  }

  return left.length - right.length;
};

export { compareStringsByCodePoint };

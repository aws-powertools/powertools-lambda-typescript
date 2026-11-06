import { describe, expect, it } from 'vitest';
import { compareStringsByCodePoint } from '../../src/index.js';

describe('Function: compareStringsByCodePoint', () => {
  it.each([
    { name: 'ASCII strings', left: 'a', right: 'b', expected: -1 },
    { name: 'reversed ASCII strings', left: 'b', right: 'a', expected: 1 },
    { name: 'equal ASCII strings', left: 'equal', right: 'equal', expected: 0 },
    { name: 'equal empty strings', left: '', right: '', expected: 0 },
    { name: 'an empty left string', left: '', right: 'a', expected: -1 },
    { name: 'an empty right string', left: 'a', right: '', expected: 1 },
    { name: 'a shorter shared prefix', left: 'a', right: 'ab', expected: -1 },
    { name: 'a longer shared prefix', left: 'ab', right: 'a', expected: 1 },
    { name: 'a differing suffix', left: 'ab', right: 'ac', expected: -1 },
    {
      name: 'a BMP and astral pair',
      left: '\uFFFF',
      right: '😀',
      expected: -1,
    },
    {
      name: 'a reversed BMP and astral pair',
      left: '😀',
      right: '\uFFFF',
      expected: 1,
    },
    { name: 'two astral characters', left: '😀', right: '😁', expected: -1 },
    {
      name: 'two reversed astral characters',
      left: '😁',
      right: '😀',
      expected: 1,
    },
    { name: 'equal astral strings', left: '😀', right: '😀', expected: 0 },
    { name: 'a shorter astral prefix', left: '😀', right: '😀a', expected: -1 },
    { name: 'a longer astral prefix', left: '😀a', right: '😀', expected: 1 },
    {
      name: 'a suffix after an astral prefix',
      left: '😀a',
      right: '😀b',
      expected: -1,
    },
    {
      name: 'distinct non-normalized strings',
      left: 'e\u0301',
      right: 'é',
      expected: -1,
    },
  ])('orders $name by Unicode code point', ({ left, right, expected }) => {
    // Prepare
    const comparator = compareStringsByCodePoint;

    // Act
    const result = comparator(left, right);

    // Assess
    expect(Math.sign(result)).toBe(expected);
  });
});

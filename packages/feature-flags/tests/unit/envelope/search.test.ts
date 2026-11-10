import { describe, expect, it } from 'vitest';
import { search } from '../../../src/envelope/index.js';

describe('Envelope search', () => {
  it.each([
    {
      expression: 'settings.flags',
      document: { settings: { flags: { checkout: { default: true } } } },
    },
    {
      expression: 'powertools_json(settings).flags',
      document: { settings: '{"flags":{"checkout":{"default":true}}}' },
    },
  ])('selects a Flag Document with $expression', ({ expression, document }) => {
    // Prepare
    const expected = { checkout: { default: true } };
    // Act
    const result = search(expression, document);
    // Assess
    expect(result).toEqual(expected);
  });
});

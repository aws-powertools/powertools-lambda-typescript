import { search } from '../../src';

describe('Filer operator tests', () => {
  it.each([
    
  ])('should support the current operator', ({ expression, expected }) => {
    // Prepare
    const data = ;

    // Act
    const result = search(expression, data);

    // Assess
    expect(result).toStrictEqual(expected);
  });
});

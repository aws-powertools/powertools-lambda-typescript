/**
 * Test Compliance with the JMESPath specification
 *
 * @group unit/jmespath/compliance/canary
 */
import { search } from '../../src';

describe('index', () => {
  it('should be defined', () => {
    const expression = 'foo[8:2:0]';
    const data = {
      type: 'object',
    };

    /* const res = search(expression, data);
    expect(res).toEqual([1, 2]); */

    expect(() => search(expression, data)).toThrowError(
      'Invalid slice, step cannot be 0'
    );
  });
});

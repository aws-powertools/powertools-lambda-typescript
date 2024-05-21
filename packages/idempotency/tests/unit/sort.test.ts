/**
 * Test sort function
 *
 * @group unit/commons/sort
 */

import { sort } from '../../src/sort';

describe('Function: sort', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('can sort string correctly', () => {
    expect(sort('test')).toEqual('test');
  });

  test('can sort number correctly', () => {
    expect(sort(5)).toEqual(5);
  });

  test('can sort boolean correctly', () => {
    expect(sort(true)).toEqual(true);
    expect(sort(false)).toEqual(false);
  });

  test('can sort null correctly', () => {
    expect(sort(null)).toEqual(null);
  });

  test('can sort undefined correctly', () => {
    expect(sort(undefined)).toEqual(undefined);
  });
});

import { Hello } from '../../src';

describe('Simple expression tests', () => {
  test('Hello', () => {
    expect(Hello('Carl')).toBe('Hello Carl');
    expect(Hello()).toBe('Hello unknown person');
  });
});

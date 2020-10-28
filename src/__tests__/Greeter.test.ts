import { Hello } from '../index';
describe('Simple expression tests', () => {
  test('Hello', () => {
    expect(Hello('Carl')).toBe('Hello Carl');
    expect(Hello()).toBe('Hello unknown person');
  });
});

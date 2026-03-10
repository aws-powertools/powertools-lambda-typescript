import { describe, expect, expectTypeOf, it } from 'vitest';
import { Store } from '../../src/store/Store.js';

describe('Class: Store', () => {
  it('sets and gets a value', () => {
    const store = new Store<{ userId: string }>();
    store.set('userId', '123');
    expect(store.get('userId')).toBe('123');
  });

  it('returns undefined for an unset key', () => {
    const store = new Store<{ userId: string }>();
    expect(store.get('userId')).toBeUndefined();
  });

  it('overwrites an existing value', () => {
    const store = new Store<{ userId: string }>();
    store.set('userId', '123');
    store.set('userId', '456');
    expect(store.get('userId')).toBe('456');
  });

  it('reports whether a key exists with has()', () => {
    const store = new Store<{ userId: string }>();
    expect(store.has('userId')).toBe(false);
    store.set('userId', '123');
    expect(store.has('userId')).toBe(true);
  });

  it('deletes a key', () => {
    const store = new Store<{ userId: string }>();
    store.set('userId', '123');
    expect(store.delete('userId')).toBe(true);
    expect(store.get('userId')).toBeUndefined();
    expect(store.has('userId')).toBe(false);
  });

  it('returns false when deleting a non-existent key', () => {
    const store = new Store<{ userId: string }>();
    expect(store.delete('userId')).toBe(false);
  });

  it('handles multiple keys with different types', () => {
    const store = new Store<{
      userId: string;
      isAdmin: boolean;
      count: number;
    }>();

    store.set('userId', 'abc');
    store.set('isAdmin', true);
    store.set('count', 42);

    expect(store.get('userId')).toBe('abc');
    expect(store.get('isAdmin')).toBe(true);
    expect(store.get('count')).toBe(42);
  });

  it('works with default generic (untyped)', () => {
    const store = new Store();
    store.set('anything', 'value');
    expect(store.get('anything')).toBe('value');
  });

  it('infers correct types for get()', () => {
    const store = new Store<{
      userId: string;
      isAdmin: boolean;
      count: number;
    }>();

    expectTypeOf(store.get('userId')).toEqualTypeOf<string | undefined>();
    expectTypeOf(store.get('isAdmin')).toEqualTypeOf<boolean | undefined>();
    expectTypeOf(store.get('count')).toEqualTypeOf<number | undefined>();
  });

  it('enforces value types on set()', () => {
    const store = new Store<{ userId: string; count: number }>();

    // @ts-expect-error TS2345 — number is not assignable to string
    store.set('userId', 123);
    // @ts-expect-error TS2345 — string is not assignable to number
    store.set('count', 'not a number');
  });

  it('restricts keys to those defined in the type', () => {
    const store = new Store<{ userId: string }>();

    // @ts-expect-error TS2345 — 'unknownKey' is not a valid key
    store.set('unknownKey', 'value');
    // @ts-expect-error TS2345 — 'unknownKey' is not a valid key
    store.get('unknownKey');
    // @ts-expect-error TS2345 — 'unknownKey' is not a valid key
    store.has('unknownKey');
    // @ts-expect-error TS2345 — 'unknownKey' is not a valid key
    store.delete('unknownKey');
  });
});

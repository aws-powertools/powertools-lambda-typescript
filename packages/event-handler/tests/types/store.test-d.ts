import { describe, expectTypeOf, it } from 'vitest';
import { Store } from '../../src/store/Store.js';

describe('Class: Store', () => {
  it('infers correct types for get()', () => {
    // Prepare & Act
    const store = new Store<{
      userId: string;
      isAdmin: boolean;
      count: number;
    }>();

    // Assess
    expectTypeOf(store.get('userId')).toEqualTypeOf<string | undefined>();
    expectTypeOf(store.get('isAdmin')).toEqualTypeOf<boolean | undefined>();
    expectTypeOf(store.get('count')).toEqualTypeOf<number | undefined>();
  });

  it('enforces value types on set()', () => {
    // Prepare & Act
    const store = new Store<{ userId: string; count: number }>();

    // Assess
    // @ts-expect-error TS2345 — number is not assignable to string
    store.set('userId', 123);
    // @ts-expect-error TS2345 — string is not assignable to number
    store.set('count', 'not a number');
  });

  it('restricts keys to those defined in the type', () => {
    // Prepare & Act
    const store = new Store<{ userId: string }>();

    // Assess
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

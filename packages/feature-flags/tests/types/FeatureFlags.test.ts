import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expectTypeOf, it } from 'vitest';
import { FeatureFlags, type Store } from '../../src/index.js';

describe('Type: FeatureFlags', () => {
  it('widens each batch fallback and returns enabled names', () => {
    // Prepare
    const flags = new FeatureFlags({
      store: {
        name: 'in-memory',
        getMany: async () => ({}),
        getAll: async () => ({}),
      },
    });
    // Act
    const result = flags.evaluateMany({
      flags: { a: false, b: 10, c: 'x', d: { k: 1 } },
    });
    const enabled = flags.getEnabledFeatures();
    // Assess
    expectTypeOf(result).resolves.toEqualTypeOf<{
      a: boolean;
      b: number;
      c: string;
      d: JSONValue;
    }>();
    expectTypeOf(enabled).resolves.toEqualTypeOf<string[]>();
  });

  it('requires batch fallbacks', () => {
    // Prepare
    const flags = new FeatureFlags({
      store: {
        name: 'in-memory',
        getMany: async () => ({}),
        getAll: async () => ({}),
      },
    });
    // Act
    // @ts-expect-error Flags are required to supply per-flag fallbacks.
    const result = flags.evaluateMany({});
    void result.catch(() => {});
    // Assess
    expectTypeOf(result).toExtend<Promise<Record<string, JSONValue>>>();
  });
  it('widens fallback literals to their result types', () => {
    // Prepare
    const store: Store = {
      name: 'in-memory',
      getMany: async () => ({}),
      getAll: async () => ({}),
    };
    const flags = new FeatureFlags({ store });
    // Act
    const booleanResult = flags.evaluate({ name: 'flag', default: false });
    const numberResult = flags.evaluate({ name: 'flag', default: 10 });
    const stringResult = flags.evaluate({ name: 'flag', default: 'x' });
    const objectResult = flags.evaluate({ name: 'flag', default: { a: 1 } });
    const nullResult = flags.evaluate({ name: 'flag', default: null });
    // Assess
    expectTypeOf(booleanResult).resolves.toEqualTypeOf<boolean>();
    expectTypeOf(numberResult).resolves.toEqualTypeOf<number>();
    expectTypeOf(stringResult).resolves.toEqualTypeOf<string>();
    expectTypeOf(objectResult).resolves.toEqualTypeOf<JSONValue>();
    expectTypeOf(nullResult).resolves.toEqualTypeOf<JSONValue>();
  });

  it('requires a fallback', () => {
    // Prepare
    const flags = new FeatureFlags({
      store: {
        name: 'in-memory',
        getMany: async () => ({}),
        getAll: async () => ({}),
      },
    });
    // Act
    // @ts-expect-error A default is required to avoid undefined results.
    const result = flags.evaluate({ name: 'flag' });
    // Assess
    expectTypeOf(result).toExtend<Promise<JSONValue>>();
  });
});

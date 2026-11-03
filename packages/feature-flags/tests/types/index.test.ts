import { describe, expectTypeOf, it } from 'vitest';
import type { Store } from '../../src/types/index.js';

describe('Type: Store', () => {
  it('accepts a store implementation', () => {
    // Prepare
    const store = {
      name: 'local',
      getMany: async () => ({}),
      getAll: async () => ({}),
    } satisfies Store;

    // Act
    const result = store.getAll();

    // Assess
    expectTypeOf(store).toExtend<Store>();
    expectTypeOf(result).toExtend<ReturnType<Store['getAll']>>();
  });
});

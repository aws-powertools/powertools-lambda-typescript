import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type RuleEngineStoreOptions,
  ruleEngineStore,
  SchemaValidationError,
  type Store,
} from '../../src/index.js';

describe('Type: ruleEngineStore', () => {
  it('returns a Store from a required JSON source', () => {
    // Prepare
    const options = {
      source: async () => ({ checkout: { default: true } }),
    } satisfies RuleEngineStoreOptions;
    // Act
    const store = ruleEngineStore(options);
    // Assess
    expectTypeOf(store).toEqualTypeOf<Store>();
  });

  it('requires a source', () => {
    // Prepare
    const options = {};
    // Act
    // @ts-expect-error A source is required to retrieve Flag Documents.
    const store = ruleEngineStore(options);
    // Assess
    expectTypeOf(store).toEqualTypeOf<Store>();
  });

  it('validates non-object JSON sources at runtime', async () => {
    // Prepare
    const store = ruleEngineStore({ source: async () => 1 });
    // Act
    const result = store.getAll({});
    // Assess
    expectTypeOf(result).toEqualTypeOf<ReturnType<Store['getAll']>>();
    await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
  });
});

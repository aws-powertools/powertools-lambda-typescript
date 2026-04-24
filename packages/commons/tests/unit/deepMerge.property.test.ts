import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { deepMerge } from '../../src/deepMerge.js';

/**
 * Arbitrary that generates JSON-like plain objects (no class instances,
 * no circular refs) suitable for deepMerge property tests.
 */
const jsonObject = (): fc.Arbitrary<Record<string, unknown>> =>
  fc.dictionary(
    fc.string({ minLength: 1, maxLength: 5 }),
    fc.letrec((tie) => ({
      value: fc.oneof(
        { depthSize: 'small' },
        fc.string(),
        fc.integer(),
        fc.boolean(),
        fc.constant(null),
        fc.array(tie('value'), { maxLength: 3, depthSize: 'small' }),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 5 }), tie('value'), {
          maxKeys: 3,
        })
      ),
    })).value,
    { maxKeys: 5 }
  );

describe('deepMerge property tests', () => {
  it('never mutates source objects', () => {
    fc.assert(
      fc.property(
        fc.array(jsonObject(), { minLength: 1, maxLength: 4 }),
        (sources) => {
          const snapshots = sources.map((s) => structuredClone(s));

          deepMerge({}, ...sources);

          for (let i = 0; i < sources.length; i++) {
            expect(sources[i]).toEqual(snapshots[i]);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns the target reference', () => {
    fc.assert(
      fc.property(jsonObject(), jsonObject(), (target, source) => {
        const result = deepMerge(target, source);
        expect(result).toBe(target);
      }),
      { numRuns: 200 }
    );
  });

  it('result contains all top-level keys from all sources', () => {
    fc.assert(
      fc.property(
        fc.array(jsonObject(), { minLength: 1, maxLength: 4 }),
        (sources) => {
          const result = deepMerge({}, ...sources);
          const resultKeys = new Set(Object.keys(result));

          for (const source of sources) {
            for (const key of Object.keys(source)) {
              expect(resultKeys.has(key)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('merging a source into empty object then merging same source again is idempotent', () => {
    fc.assert(
      fc.property(jsonObject(), (source) => {
        const first = deepMerge({}, source);
        const second = deepMerge(structuredClone(first), source);
        expect(second).toEqual(first);
      }),
      { numRuns: 200 }
    );
  });
});

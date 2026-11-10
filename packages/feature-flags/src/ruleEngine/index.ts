import type { Store, StoreResult } from '../types/index.js';
import { evaluate } from './evaluate.js';
import { currentDate } from './time.js';
import type { RuleEngineStoreOptions } from './types.js';
import { validate } from './validate.js';

/**
 * Creates a local {@link Store | `Store`} that evaluates Python-format Flag Documents.
 * Supports Powertools for Python 3.36.0 Actions and missing-key semantics.
 * Uses strict boolean/number equality, throws for incompatible operands, rejects numeric Rule names that JavaScript reorders, and rejects falsy non-object rules.
 *
 * Membership Actions check strict array membership, own object keys, or Unicode code-point substrings.
 * Validates the entire document on every retrieval and propagates source errors unchanged.
 * Schedule Actions ignore caller context and read the clock in their IANA timezone, defaulting to UTC.
 * MODULO_RANGE uses Python's positive-divisor remainder, including negative and fractional contexts.
 *
 * @param {Object} options - Configure retrieval and logging
 * @param {Function} options.source - Retrieve a Flag Document for each Store call
 * @param {GenericLogger} options.logger - Log warnings and outcomes without values
 * @param {Function} options.now - Supply the schedule clock, defaulting to () => new Date()
 * @example
 * ```typescript
 * const store = ruleEngineStore({
 *   source: async () => ({ checkout_v2: { default: true } }),
 * });
 * const flags = new FeatureFlags({ store });
 * const enabled = await flags.evaluate({ name: 'checkout_v2', default: false });
 * ```
 */
const ruleEngineStore = ({
  source,
  logger,
  now = currentDate,
}: RuleEngineStoreOptions): Store => ({
  name: 'rule-engine',
  getMany: async (names, context) => {
    const document = validate(await source(), logger);
    const results: [string, StoreResult][] = [];
    for (const name of new Set(names)) {
      results.push([
        name,
        Object.hasOwn(document, name)
          ? evaluate(name, document[name], context, logger, now)
          : { found: false },
      ]);
    }
    // Object.fromEntries keeps __proto__ and other inherited names as own keys.
    return Object.fromEntries(results);
  },
  getAll: async (context) => {
    const document = validate(await source(), logger);
    const results: [string, StoreResult][] = [];
    for (const [name, flag] of Object.entries(document)) {
      results.push([name, evaluate(name, flag, context, logger, now)]);
    }
    return Object.fromEntries(results);
  },
});

export type { RuleEngineStoreOptions } from './types.js';
export { ruleEngineStore };

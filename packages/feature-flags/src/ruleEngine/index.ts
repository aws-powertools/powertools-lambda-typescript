import { StoreNames } from '../constants.js';
import type { Store, StoreResult } from '../types/index.js';
import type { RuleEngineStoreOptions } from '../types/RuleEngine.js';
import { evaluate } from './evaluate.js';
import { currentDate } from './time.js';
import { createValidationCache } from './validationCache.js';

/**
 * Creates a local {@link Store | `Store`} that evaluates Python-format Flag Documents.
 * Supports Powertools for Python 3.36.0 Actions and missing-key semantics.
 * Uses strict boolean/number equality, throws for incompatible operands, rejects numeric Rule names that JavaScript reorders, and rejects falsy non-object rules.
 *
 * Membership Actions check strict array membership, own object keys, or Unicode code-point substrings.
 * Retrieves the source on every call and propagates source errors unchanged.
 * Keeps only the latest validated, compiled snapshot, keyed by JSON content without sorting keys.
 * Validates the entire document when content changes; invalid replacements throw without replacing the snapshot.
 * Empty-document and empty-rules warnings fire on validation, once per new document content rather than every call.
 * Each call evaluates its captured, owned snapshot and returns copies of structured values.
 * Schedule Actions ignore caller context and read the clock in their IANA timezone, defaulting to UTC.
 * Reads the clock once after retrieving and validating each document, sharing the instant across all flags and Conditions in that call.
 * MODULO_RANGE uses Python's positive-divisor remainder, including negative and fractional contexts.
 *
 * @param {Object} options - Configure retrieval and logging
 * @param {string} options.name - Name the Store, defaulting to `rule-engine`
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
  name = StoreNames.RULE_ENGINE,
}: RuleEngineStoreOptions): Store => {
  const validateDocument = createValidationCache(logger);

  return {
    name,
    getMany: async (names, context) => {
      const document = validateDocument(await source());
      const instant = now();
      const results: [string, StoreResult][] = [];
      for (const name of new Set(names)) {
        results.push([
          name,
          Object.hasOwn(document, name)
            ? evaluate(name, document[name], { context, logger, now: instant })
            : { found: false },
        ]);
      }
      // Object.fromEntries keeps __proto__ and other inherited names as own keys.
      return Object.fromEntries(results);
    },
    getAll: async (context) => {
      const document = validateDocument(await source());
      const instant = now();
      const results: [string, StoreResult][] = [];
      for (const [name, flag] of Object.entries(document)) {
        results.push([
          name,
          evaluate(name, flag, { context, logger, now: instant }),
        ]);
      }
      return Object.fromEntries(results);
    },
  };
};

export type { RuleEngineStoreOptions } from '../types/RuleEngine.js';
export { ruleEngineStore };

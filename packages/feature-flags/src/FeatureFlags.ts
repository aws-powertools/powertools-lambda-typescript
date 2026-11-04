import { isNumber, isString } from '@aws-lambda-powertools/commons';
import type {
  GenericLogger,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import {
  FlagValueTypeError,
  InvalidContextError,
  StoreUnavailableError,
} from './errors.js';
import type {
  ContextScalar,
  EvaluateOptions,
  EvaluateResult,
  FeatureFlagsOptions,
  Store,
} from './types/index.js';

/**
 * Evaluates feature flags against a caller-supplied {@link Store | `Store`}.
 *
 * @example
 * ```typescript
 * const flags = new FeatureFlags({ store: myStore });
 * const enabled = await flags.evaluate({ name: 'checkout_v2', default: false });
 * ```
 */
class FeatureFlags {
  readonly #store: Store;
  readonly #logger?: GenericLogger;

  /**
   * Creates a feature flag evaluator.
   * @param {Object} options - Configure the evaluator
   * @param {Store} options.store - Supply the Store for flag lookups
   * @param {GenericLogger} options.logger - Log outcomes without values
   */
  public constructor(options: FeatureFlagsOptions) {
    this.#store = options.store;
    this.#logger = options.logger;
  }

  /**
   * Evaluates one flag and returns its value or the required fallback.
   *
   * Handles {@link StoreUnavailableError | `StoreUnavailableError`} with the fallback.
   *
   * @param {Object} options - Configure the flag evaluation
   * @param {string} options.name - Identify the flag
   * @param {EvaluationContext} options.context - Supply scalar facts for evaluation
   * @param {JSONValue} options.default - Supply the fallback and expected primitive type
   * @example
   * ```typescript
   * const enabled = await flags.evaluate({
   *   name: 'checkout_v2', context: { tier: 'premium' }, default: false,
   * });
   * ```
   */
  public evaluate<Fallback extends JSONValue>(
    options: EvaluateOptions<Fallback>
  ): Promise<EvaluateResult<Fallback>>;
  public async evaluate(
    options: EvaluateOptions<JSONValue>
  ): Promise<JSONValue> {
    const { name, context = {}, default: fallback } = options;
    for (const [key, value] of Object.entries(context)) {
      if (
        !(Array.isArray(value)
          ? Array.from(value).every(isContextScalar)
          : isContextScalar(value))
      ) {
        throw new InvalidContextError(
          `Invalid evaluation context key '${key}'`
        );
      }
    }

    let result: Awaited<ReturnType<Store['getMany']>>;
    try {
      result = await this.#store.getMany([name], context);
    } catch (error) {
      if (!(error instanceof StoreUnavailableError)) throw error;
      this.#logger?.warn({
        name,
        store: this.#store.name,
        reason: 'unavailable',
      });
      this.#logger?.debug({
        name,
        store: this.#store.name,
        outcome: 'fallback',
      });
      return fallback;
    }

    const flag = result[name];
    if (!flag?.found) {
      this.#logger?.warn({ name, store: this.#store.name, reason: 'missing' });
      this.#logger?.debug({
        name,
        store: this.#store.name,
        outcome: 'fallback',
      });
      return fallback;
    }

    const expected = typeof fallback;
    if (
      (expected === 'boolean' ||
        expected === 'number' ||
        expected === 'string') &&
      typeof flag.value !== expected
    ) {
      throw new FlagValueTypeError(
        `Flag '${name}' expected type '${expected}' but received '${typeof flag.value}'`
      );
    }
    this.#logger?.debug({ name, store: this.#store.name, outcome: 'found' });
    return flag.value;
  }
}

/**
 * Checks whether a context value is scalar without rejecting non-finite numbers.
 * @param value - Supply the context value to check
 * @internal
 */
const isContextScalar = (value: unknown): value is ContextScalar =>
  isString(value) || isNumber(value) || typeof value === 'boolean';

export { FeatureFlags };

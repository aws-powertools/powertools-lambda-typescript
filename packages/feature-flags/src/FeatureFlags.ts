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
  StoreResult,
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
          ? Array.from(value).every(isScalar)
          : isScalar(value))
      ) {
        throw new InvalidContextError(
          `Invalid evaluation context key '${key}': expected a string, number, boolean, or array of those, received ${getInvalidContextKind(value)}`
        );
      }
    }

    let result: Record<string, StoreResult>;
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

    if (isScalar(fallback) && typeof flag.value !== typeof fallback) {
      throw new FlagValueTypeError(
        `Flag '${name}' expected type '${typeof fallback}' but received '${typeof flag.value}'`
      );
    }
    this.#logger?.debug({ name, store: this.#store.name, outcome: 'found' });
    return flag.value;
  }
}

/**
 * Checks for a string, number, or boolean in context values and fallbacks.
 * @param value - Supply the value to check
 * @internal
 */
const isScalar = (value: unknown): value is ContextScalar =>
  isString(value) || isNumber(value) || typeof value === 'boolean';

/**
 * Describes an invalid context value's kind without exposing its value.
 * @param value - Supply the invalid context value to describe
 * @internal
 */
const getInvalidContextKind = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    const offendingElement = Array.from(value).find(
      (element) => !isScalar(element)
    );
    return `an array containing ${getInvalidContextKind(offendingElement)}`;
  }
  return typeof value;
};

export { FeatureFlags };

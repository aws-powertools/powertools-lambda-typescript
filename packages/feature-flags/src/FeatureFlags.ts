import { isNumber, isString } from '@aws-lambda-powertools/commons';
import type {
  GenericLogger,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  FlagResultValidationError,
  FlagValueTypeError,
  InvalidContextError,
  StoreUnavailableError,
} from './errors.js';
import type {
  ContextScalar,
  EvaluateManyOptions,
  EvaluateManyResult,
  EvaluateOptions,
  EvaluateResult,
  EvaluateWithSchemaOptions,
  EvaluationContext,
  FeatureFlagsOptions,
  GetEnabledFeaturesOptions,
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
   * Evaluates one flag with a schema and returns its validated output.
   *
   * Validates the fallback before contacting the {@link Store | `Store`}.
   *
   * @param options - Supply the name, context, schema, and fallback
   * @example
   * ```typescript
   * const settings = await flags.evaluate({
   *   name: 'settings', default: { theme: 'light' }, schema: settingsSchema,
   * });
   * ```
   */
  public evaluate<Schema extends StandardSchemaV1>(
    options: EvaluateWithSchemaOptions<Schema>
  ): Promise<StandardSchemaV1.InferOutput<Schema>>;

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
  public async evaluate<Schema extends StandardSchemaV1>(
    options: EvaluateOptions<JSONValue> | EvaluateWithSchemaOptions<Schema>
  ): Promise<JSONValue> {
    const { name, context = {} } = options;
    validateContext(context);
    const fallback =
      'schema' in options
        ? await validateWithSchema(
            name,
            'fallback',
            options.default,
            options.schema
          )
        : options.default;

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

    let value = flag.value;
    if ('schema' in options) {
      value = await validateWithSchema(name, 'result', value, options.schema);
    } else {
      validateFlagValue(name, fallback, value);
    }
    this.#logger?.debug({ name, store: this.#store.name, outcome: 'found' });
    return value;
  }

  /**
   * Evaluates several flags with an independent fallback for each flag.
   *
   * Handles {@link StoreUnavailableError | `StoreUnavailableError`} with every fallback.
   *
   * @param {Object} options - Configure the batch evaluation
   * @param {Object} options.flags - Supply flag names and their fallbacks
   * @param {EvaluationContext} options.context - Supply scalar facts for evaluation
   * @param {Object} options.schemas - Validate selected flags and their fallbacks
   * @example
   * ```typescript
   * const result = await flags.evaluateMany({
   *   flags: { checkout_v2: false, limit: 10 }, context: { tier: 'premium' },
   * });
   * const settings = await flags.evaluateMany({
   *   flags: { settings: { theme: 'light' }, banner: 'none' },
   *   schemas: { settings: settingsSchema },
   * });
   * ```
   */
  public evaluateMany<
    Flags extends Record<string, JSONValue>,
    Schemas extends Partial<Record<string, StandardSchemaV1>> = Partial<
      Record<string, never>
    >,
  >(
    options: EvaluateManyOptions<Flags, Schemas>
  ): Promise<EvaluateManyResult<Flags, Schemas>>;
  public async evaluateMany(
    options: EvaluateManyOptions<Record<string, JSONValue>> & {
      schemas?: Record<string, StandardSchemaV1>;
    }
  ): Promise<Record<string, JSONValue>> {
    const { flags, context = {}, schemas = {} } = options;
    validateContext(context);
    const names = Object.keys(flags);
    const fallbacks: [string, JSONValue][] = [];
    for (const name of names) {
      const schema = Object.hasOwn(schemas, name) ? schemas[name] : undefined;
      fallbacks.push([
        name,
        schema
          ? await validateWithSchema(name, 'fallback', flags[name], schema)
          : flags[name],
      ]);
    }
    let result: Record<string, StoreResult>;
    try {
      result = await this.#store.getMany(names, context);
    } catch (error) {
      if (!(error instanceof StoreUnavailableError)) throw error;
      this.#logger?.warn({
        store: this.#store.name,
        reason: 'unavailable',
        names,
      });
      this.#logger?.debug({
        store: this.#store.name,
        outcome: 'fallback',
        names,
      });
      return Object.fromEntries(fallbacks);
    }

    const values: [string, JSONValue][] = [];
    const missing: string[] = [];
    for (const [name, fallback] of fallbacks) {
      const flag = result[name];
      if (!flag?.found) {
        missing.push(name);
        values.push([name, fallback]);
      } else {
        const schema = Object.hasOwn(schemas, name) ? schemas[name] : undefined;
        if (schema) {
          values.push([
            name,
            await validateWithSchema(name, 'result', flag.value, schema),
          ]);
        } else {
          validateFlagValue(name, fallback, flag.value);
          values.push([name, flag.value]);
        }
      }
    }
    if (missing.length > 0) {
      this.#logger?.warn({
        store: this.#store.name,
        reason: 'missing',
        names: missing,
      });
    }
    this.#logger?.debug({
      store: this.#store.name,
      outcome:
        missing.length === 0
          ? 'found'
          : missing.length === names.length
            ? 'fallback'
            : 'partial',
      names,
    });
    return Object.fromEntries(values);
  }

  /**
   * Gets enabled flag names in the {@link Store | `Store`}'s iteration order.
   *
   * @param {Object} options - Configure the lookup
   * @param {EvaluationContext} options.context - Supply scalar facts for evaluation
   * @example
   * ```typescript
   * const enabled = await flags.getEnabledFeatures({ context: { tier: 'premium' } });
   * ```
   */
  public async getEnabledFeatures(
    options: GetEnabledFeaturesOptions = {}
  ): Promise<string[]> {
    const { context = {} } = options;
    validateContext(context);
    let result: Record<string, StoreResult>;
    try {
      result = await this.#store.getAll(context);
    } catch (error) {
      if (!(error instanceof StoreUnavailableError)) throw error;
      this.#logger?.warn({ store: this.#store.name, reason: 'unavailable' });
      this.#logger?.debug({
        store: this.#store.name,
        outcome: 'fallback',
        enabled: 0,
      });
      return [];
    }
    const enabled: string[] = [];
    for (const [name, flag] of Object.entries(result)) {
      if (flag.found && flag.enabled) enabled.push(name);
    }
    this.#logger?.debug({
      store: this.#store.name,
      outcome: 'found',
      enabled: enabled.length,
    });
    return enabled;
  }
}

/**
 * Validates a fallback or Store result and returns the schema output.
 * @param name - Identify the flag
 * @param source - Identify the fallback or result
 * @param value - Supply the value to validate
 * @param schema - Supply the Standard Schema validator
 * @internal
 */
const validateWithSchema = async (
  name: string,
  source: 'fallback' | 'result',
  value: unknown,
  schema: StandardSchemaV1
): Promise<JSONValue> => {
  const result = await schema['~standard'].validate(value);
  if (result.issues) {
    throw new FlagResultValidationError(name, source, result.issues);
  }
  // Schemas own the validated value contract; public overloads expose their output type.
  return result.value as JSONValue;
};

/**
 * Validates scalar context facts before contacting the Store.
 * @param context - Supply the evaluation context
 * @internal
 */
const validateContext = (context: EvaluationContext): void => {
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
};

/**
 * Checks a Store value against its primitive fallback type.
 * @param name - Identify the flag
 * @param fallback - Supply the expected primitive type
 * @param value - Supply the Store value
 * @internal
 */
const validateFlagValue = (
  name: string,
  fallback: JSONValue,
  value: JSONValue
): void => {
  if (isScalar(fallback) && typeof value !== typeof fallback) {
    throw new FlagValueTypeError(
      `Flag '${name}' expected type '${typeof fallback}' but received '${typeof value}'`
    );
  }
};

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

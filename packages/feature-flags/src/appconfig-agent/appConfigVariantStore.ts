import { isRecord } from '@aws-lambda-powertools/commons';
import { isRunningInLambda } from '@aws-lambda-powertools/commons/utils/env';
import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
import { FlagNotFoundError } from '@aws-lambda-powertools/parameters/errors';
import { StoreNames } from '../constants.js';
import { isFiniteContextValue, isScalar } from '../context.js';
import {
  InvalidContextError,
  SchemaValidationError,
  StoreUnavailableError,
} from '../errors.js';
import { isAvailabilityFailure } from '../parameters-stores/classify.js';
import type { AppConfigVariantStoreOptions } from '../types/AppConfigVariantStore.js';
import type {
  ContextScalar,
  ContextValue,
  EvaluationContext,
  Store,
  StoreResult,
  Variant,
} from '../types/index.js';
import { registerVariantStore } from '../variant.js';

/**
 * Creates a Store that retrieves Agent-selected AppConfig Variants.
 *
 * Requires AppConfig Agent version `2.0.230173` or later and the optional
 * `@aws-lambda-powertools/parameters` peer. The Agent owns evaluation, caching,
 * and polling. A single requested flag in Lambda uses selective retrieval;
 * batches and getAll retrieve the whole profile and select flags locally.
 * Normalizes only requested flags in a batch.
 *
 * Outside Lambda or with `POWERTOOLS_DEV` enabled, every method uses the whole
 * profile from `POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE`. Set that variable to a
 * flag-keyed JSON object, not an unwrapped single flag.
 *
 * Context keys must match `^[A-Za-z_][A-Za-z0-9_.-]*$`; values must be strings,
 * finite numbers, or booleans. Rejects arrays and invalid context before retrieval.
 * Parameters JSON-quotes and ASCII-escapes strings in the Agent Context header.
 *
 * @param {Object} options - Configure retrieval and logging
 * @param {string} options.name - Identify the configuration profile
 * @param {string} options.environment - Identify the environment
 * @param {string} options.application - Identify the application or use the service name
 * @param {number} options.timeout - Set the request timeout in milliseconds
 * @param {GenericLogger} options.logger - Log selected Variant names without values
 * @example
 * ```typescript
 * const flags = new FeatureFlags({
 *   store: appConfigVariantStore({ environment: 'prod', name: 'features' }),
 * });
 * const ui = await flags.evaluate({
 *   name: 'ui_refresh', context: { tier: 'premium' }, default: disabledVariant(),
 * });
 * ```
 */
const appConfigVariantStore = (
  options: AppConfigVariantStoreOptions
): Store<Variant> => {
  /** Retrieves JSON through Parameters and classifies transport failures. */
  const retrieve = async (
    context: EvaluationContext,
    flags?: readonly string[]
  ): Promise<unknown> => {
    validateVariantContext(context);
    try {
      return await getConfig(options.name, {
        application: options.application,
        environment: options.environment,
        timeout: options.timeout,
        transform: 'json',
        throwOnMissing: true,
        agentOptions: {
          ...(flags ? { flags } : {}),
          context,
        },
      });
    } catch (error) {
      if (error instanceof FlagNotFoundError) throw error;
      if (isAvailabilityFailure(error)) {
        throw new StoreUnavailableError(
          `${StoreNames.APPCONFIG_VARIANT} is unavailable`,
          { cause: error }
        );
      }
      throw error;
    }
  };
  const store: Store<Variant> = {
    name: StoreNames.APPCONFIG_VARIANT,
    getMany: async (names, context) => {
      const requested = [...new Set(names)];
      if (requested.length === 1 && isRunningInLambda()) {
        const name = requested[0];
        let flag: unknown;
        try {
          flag = await retrieve(context, requested);
        } catch (error) {
          if (error instanceof FlagNotFoundError) {
            return Object.fromEntries([[name, { found: false }]]);
          }
          throw error;
        }
        return Object.fromEntries([[name, normalize(name, flag, options)]]);
      }
      const profile = validateProfile(await retrieve(context));
      const results: [string, StoreResult<Variant>][] = [];
      for (const name of requested) {
        results.push([
          name,
          Object.hasOwn(profile, name)
            ? normalize(name, profile[name], options)
            : { found: false },
        ]);
      }
      return Object.fromEntries(results);
    },
    getAll: async (context) => {
      const profile = validateProfile(await retrieve(context));
      const results: [string, StoreResult<Variant>][] = [];
      for (const [name, flag] of Object.entries(profile)) {
        results.push([name, normalize(name, flag, options)]);
      }
      return Object.fromEntries(results);
    },
  };
  registerVariantStore(store);
  return store;
};

/** Rejects Agent-incompatible context and narrows its values for Parameters. @internal */
function validateVariantContext(
  context: EvaluationContext
): asserts context is Record<string, ContextScalar> {
  for (const [key, value] of Object.entries(context)) {
    if (
      !/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key) ||
      !isScalar(value) ||
      (typeof value === 'number' && !Number.isFinite(value))
    ) {
      throw new InvalidContextError(`Invalid evaluation context key '${key}'`);
    }
  }
}

/** Rejects a whole-profile response that is not a flag-keyed object. @internal */
const validateProfile = (profile: unknown): Record<string, unknown> => {
  if (!isRecord(profile)) {
    throw new SchemaValidationError(
      'AppConfig Variant profile must be an object'
    );
  }
  return profile;
};

/** Normalizes one flag without exposing response values in errors or logs. @internal */
const normalize = (
  name: string,
  flag: unknown,
  options: AppConfigVariantStoreOptions
): StoreResult<Variant> => {
  if (!isRecord(flag)) {
    throw new SchemaValidationError(`Flag '${name}' must be an object`);
  }
  const variant = Object.hasOwn(flag, '_variant') ? flag._variant : 'default';
  if (
    !Object.hasOwn(flag, 'enabled') ||
    typeof flag.enabled !== 'boolean' ||
    typeof variant !== 'string'
  ) {
    throw new SchemaValidationError(
      `Flag '${name}' must contain valid Variant fields`
    );
  }
  const attributes: [string, ContextValue][] = [];
  for (const [key, value] of Object.entries(flag)) {
    if (key === 'enabled' || key === '_variant') continue;
    if (!isFiniteContextValue(value)) {
      throw new SchemaValidationError(
        `Flag '${name}' must contain valid Variant attributes`
      );
    }
    attributes.push([key, value]);
  }
  const value: Variant = {
    enabled: flag.enabled,
    variant,
    attributes: Object.fromEntries(attributes),
  };
  options.logger?.debug({
    store: StoreNames.APPCONFIG_VARIANT,
    name,
    variant: value.variant,
  });
  return { found: true, value, enabled: value.enabled };
};

/**
 * Creates a fresh disabled Variant fallback with no attributes.
 * @example
 * ```typescript
 * const ui = await flags.evaluate({ name: 'ui_refresh', default: disabledVariant() });
 * ```
 */
const disabledVariant = (): Variant => ({
  enabled: false,
  variant: 'default',
  attributes: {},
});

export { appConfigVariantStore, disabledVariant };

import type {
  GenericLogger,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { FeatureFlags } from '../FeatureFlags.js';

/** Configures the Store and optional logger for flag evaluation. */
type FeatureFlagsOptions<Value = JSONValue> = {
  /** Provides flag lookups. */
  store: Store<Value>;
  /** Logs evaluation outcomes without values. */
  logger?: GenericLogger;
};

/**
 * Widens primitive fallbacks and uses JSONValue for structured fallbacks.
 *
 * A structured literal cannot soundly describe a Store result.
 */
type EvaluateResult<Fallback> = Fallback extends boolean
  ? boolean
  : Fallback extends number
    ? number
    : Fallback extends string
      ? string
      : JSONValue;

/** Supplies the flag name, context, and required fallback for evaluation. */
type EvaluateOptions<Fallback extends JSONValue> = {
  name: string;
  context?: EvaluationContext;
  default: Fallback;
};

/** Supplies a schema and its input fallback to {@link FeatureFlags.evaluate | `evaluate`}. */
type EvaluateWithSchemaOptions<Schema extends StandardSchemaV1> = {
  name: string;
  context?: EvaluationContext;
  default: StandardSchemaV1.InferInput<Schema>;
  /** Validates the fallback and result without producing undefined. */
  schema: undefined extends StandardSchemaV1.InferOutput<Schema>
    ? never
    : Schema;
};

/** Supplies per-flag fallbacks, optional schemas, and context to {@link FeatureFlags.evaluateMany | `evaluateMany`}. */
type EvaluateManyOptions<
  Flags extends Record<string, JSONValue>,
  Schemas extends Partial<Record<string, StandardSchemaV1>> = Partial<
    Record<string, never>
  >,
> = {
  flags: Flags;
  context?: EvaluationContext;
  /** Validates selected flags without producing undefined. */
  schemas?: Schemas & {
    [Name in keyof Schemas]: Name extends keyof Flags
      ? NonNullable<Schemas[Name]> extends StandardSchemaV1
        ? undefined extends StandardSchemaV1.InferOutput<
            NonNullable<Schemas[Name]>
          >
          ? never
          : Schemas[Name]
        : Schemas[Name]
      : never;
  };
};

/**
 * Infers a schema output or widens the fallback when no schema exists.
 * @internal
 */
type EvaluateSchemaResult<Schema, Fallback> = Schema extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<Schema>
  : EvaluateResult<Fallback>;

/** Infers schema outputs and widens other fallbacks through {@link EvaluateResult | `EvaluateResult`}. */
type EvaluateManyResult<
  Flags extends Record<string, JSONValue>,
  Schemas extends Partial<Record<string, StandardSchemaV1>> = Partial<
    Record<string, never>
  >,
> = {
  [Name in keyof Flags]: Name extends keyof Schemas
    ? EvaluateSchemaResult<Schemas[Name], Flags[Name]>
    : EvaluateResult<Flags[Name]>;
};

/** Supplies context to {@link FeatureFlags.getEnabledFeatures | `getEnabledFeatures`}. */
type GetEnabledFeaturesOptions = {
  context?: EvaluationContext;
};

/** Represents a scalar fact in an evaluation context. */
type ContextScalar = string | number | boolean;

/** Represents a scalar fact or a list of scalar facts. */
type ContextValue = ContextScalar | ContextScalar[];

/** Carries caller-supplied per-request facts for flag evaluation. */
type EvaluationContext = Record<string, ContextValue>;

/** Distinguishes a found flag and its value from a missing flag. */
type StoreResult<Value = JSONValue> =
  | { found: true; value: Value; enabled: boolean }
  | { found: false };

/** Answers the value of a flag for a given evaluation context. */
type Store<Value = JSONValue> = {
  name: string;
  getMany(
    names: readonly string[],
    context: EvaluationContext
  ): Promise<Record<string, StoreResult<Value>>>;
  getAll(
    context: EvaluationContext
  ): Promise<Record<string, StoreResult<Value>>>;
};

/** Represents a normalized AWS AppConfig multi-variant result. */
type Variant = {
  enabled: boolean;
  variant: string;
  attributes: Record<string, ContextValue>;
};

export type {
  ContextScalar,
  ContextValue,
  EvaluateManyOptions,
  EvaluateManyResult,
  EvaluateOptions,
  EvaluateResult,
  EvaluateSchemaResult,
  EvaluateWithSchemaOptions,
  EvaluationContext,
  FeatureFlagsOptions,
  GetEnabledFeaturesOptions,
  Store,
  StoreResult,
  Variant,
};
export type { EnvelopeOptions, EnvelopeSearchFn } from './Envelope.js';
export type {
  EvaluateManyVariantOptions,
  EvaluateManyVariantResult,
  EvaluateVariantOptions,
} from './VariantEvaluation.js';

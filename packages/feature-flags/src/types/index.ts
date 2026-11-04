import type { JSONValue } from '@aws-lambda-powertools/commons/types';

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
  EvaluationContext,
  Store,
  StoreResult,
  Variant,
};

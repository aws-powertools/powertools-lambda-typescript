/** Provides the base error for the feature flags utility. */
class FeatureFlagsError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FeatureFlagsError';
  }
}

/**
 * Reports a known availability failure from a Store.
 *
 * Stores throw this error for timeouts, connection failures, throttling, or
 * service unavailability. The evaluator catches this category and returns
 * fallbacks.
 */
class StoreUnavailableError extends FeatureFlagsError {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StoreUnavailableError';
  }
}

/** Reports an invalid evaluation context without exposing its values. */
class InvalidContextError extends FeatureFlagsError {
  /**
   * Creates an invalid context error.
   * @param message - Describe the invalid context key
   * @param options - Supply optional error details
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InvalidContextError';
  }
}

/** Reports a flag value whose type differs from its primitive fallback. */
class FlagValueTypeError extends FeatureFlagsError {
  /**
   * Creates a flag value type error.
   * @param message - Describe the flag and mismatched types
   * @param options - Supply optional error details
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FlagValueTypeError';
  }
}

/** Reports an invalid Flag Document without exposing its values. */
class SchemaValidationError extends FeatureFlagsError {
  /**
   * Creates a schema validation error.
   * @param message - Describe the invalid flag, Rule, or Condition
   * @param options - Supply optional error details
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SchemaValidationError';
  }
}

/** Reports incompatible Condition operands without exposing their values. */
class ConditionEvaluationError extends FeatureFlagsError {
  /**
   * Creates a condition evaluation error.
   * @param message - Identify the flag, Rule, key, and Action
   * @param options - Supply optional error details
   */
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ConditionEvaluationError';
  }
}

export {
  ConditionEvaluationError,
  FeatureFlagsError,
  FlagValueTypeError,
  InvalidContextError,
  SchemaValidationError,
  StoreUnavailableError,
};

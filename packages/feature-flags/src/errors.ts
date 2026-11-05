import type { StandardSchemaV1 } from '@standard-schema/spec';

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

/** Reports schema validation failures using issue paths without exposing values. */
class FlagResultValidationError extends FeatureFlagsError {
  public readonly flag: string;
  public readonly source: 'fallback' | 'result';

  /**
   * Creates a validation error and preserves the issues as its cause.
   * @param flag - Identify the flag
   * @param source - Identify the fallback or Store result
   * @param issues - Supply the validator's issue paths and cause
   */
  public constructor(
    flag: string,
    source: 'fallback' | 'result',
    issues: ReadonlyArray<StandardSchemaV1.Issue>
  ) {
    const paths: string[] = [];
    for (const issue of issues) {
      const segments: string[] = [];
      for (const segment of issue.path ?? []) {
        segments.push(
          String(typeof segment === 'object' ? segment.key : segment)
        );
      }
      paths.push(segments.length > 0 ? segments.join('.') : '(root)');
    }
    super(
      `Flag '${flag}' ${source} failed schema validation at ${paths.join(', ')}`,
      {
        cause: issues,
      }
    );
    this.name = 'FlagResultValidationError';
    this.flag = flag;
    this.source = source;
  }
}

export {
  FeatureFlagsError,
  FlagResultValidationError,
  FlagValueTypeError,
  InvalidContextError,
  StoreUnavailableError,
};

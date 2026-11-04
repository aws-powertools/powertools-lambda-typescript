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

export { FeatureFlagsError, StoreUnavailableError };

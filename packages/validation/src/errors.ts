/**
 * Base error class for all validation errors.
 */
class ValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when a schema validation fails.
 */
class SchemaValidationError extends ValidationError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Error thrown when a schema compilation fails.
 */
class SchemaCompilationError extends ValidationError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SchemaCompilationError';
  }
}

export { ValidationError, SchemaValidationError, SchemaCompilationError };

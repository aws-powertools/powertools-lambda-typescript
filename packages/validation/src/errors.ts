/**
 * Base error class for all validation errors.
 *
 * This error is usually not thrown directly, but it's used as a base class for
 * other errors thrown by the Validation utility. You can use it to catch all
 * validation errors in a single catch block.
 */
class ValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when a schema validation fails.
 *
 * This error is thrown when the validation of a payload against a schema fails,
 * the `cause` property contains the original Ajv issues.
 *
 * @example
 * ```typescript
 * import { validate } from '@aws-lambda-powertools/validation';
 * import { ValidationError } from '@aws-lambda-powertools/validation/errors';
 *
 * const schema = {
 *   type: 'number',
 *   minimum: 0,
 *   maximum: 100,
 * };
 *
 * const payload = -1;
 *
 * try {
 *   validate({ payload, schema });
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     // cause includes the original Ajv issues
 *     const { message, cause } = error;
 *     // ... handle the error
 *   }
 *
 *   // handle other errors
 * }
 * ```
 */
class SchemaValidationError extends ValidationError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Error thrown when a schema compilation fails.
 *
 * This error is thrown when you pass an invalid schema to the validator.
 *
 * @example
 * ```typescript
 * import { validate } from '@aws-lambda-powertools/validation';
 *
 * const schema = {
 *   invalid: 'schema',
 * };
 *
 * try {
 *   validate({ payload: {}, schema });
 * } catch (error) {
 *   if (error instanceof SchemaCompilationError) {
 *     // handle the error
 *   }
 *
 *   // handle other errors
 * }
 * ```
 */
class SchemaCompilationError extends ValidationError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SchemaCompilationError';
  }
}

export { ValidationError, SchemaValidationError, SchemaCompilationError };

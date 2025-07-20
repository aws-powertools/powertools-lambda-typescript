/**
 * Error thrown when a resolver is not found for a given field and type name in AppSync GraphQL.
 */
class ResolverNotFoundException extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ResolverNotFoundException';
  }
}

/**
 * Error thrown when the response from a batch resolver is invalid.
 */
class InvalidBatchResponseException extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InvalidBatchResponseException';
  }
}

export { ResolverNotFoundException, InvalidBatchResponseException };

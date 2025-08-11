export class RouteMatchingError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly method: string
  ) {
    super(message);
    this.name = 'RouteMatchingError';
  }
}

export class ParameterValidationError extends RouteMatchingError {
  constructor(public readonly issues: string[]) {
    super(`Parameter validation failed: ${issues.join(', ')}`, '', '');
    this.name = 'ParameterValidationError';
  }
}

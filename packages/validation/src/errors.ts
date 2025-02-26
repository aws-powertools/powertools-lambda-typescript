export class SchemaValidationError extends Error {
  public errors: unknown;

  constructor(message: string, errors?: unknown) {
    super(message);
    this.name = 'SchemaValidationError';
    this.errors = errors;
  }
}

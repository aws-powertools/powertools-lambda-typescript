import type { ErrorResponse, HttpStatusCode } from '../types/rest.js';
import { HttpErrorCodes } from './constants.js';

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

abstract class ServiceError extends Error {
  abstract readonly statusCode: HttpStatusCode;
  abstract readonly errorType: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options);
    this.name = 'ServiceError';
    this.details = details;
  }

  toJSON(): ErrorResponse {
    return {
      statusCode: this.statusCode,
      error: this.errorType,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

export class BadRequestError extends ServiceError {
  readonly statusCode = HttpErrorCodes.BAD_REQUEST;
  readonly errorType = 'BadRequestError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

export class UnauthorizedError extends ServiceError {
  readonly statusCode = HttpErrorCodes.UNAUTHORIZED;
  readonly errorType = 'UnauthorizedError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

export class ForbiddenError extends ServiceError {
  readonly statusCode = HttpErrorCodes.FORBIDDEN;
  readonly errorType = 'ForbiddenError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

export class NotFoundError extends ServiceError {
  readonly statusCode = HttpErrorCodes.NOT_FOUND;
  readonly errorType = 'NotFoundError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

export class MethodNotAllowedError extends ServiceError {
  readonly statusCode = HttpErrorCodes.METHOD_NOT_ALLOWED;
  readonly errorType = 'MethodNotAllowedError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

export class RequestTimeoutError extends ServiceError {
  readonly statusCode = HttpErrorCodes.REQUEST_TIMEOUT;
  readonly errorType = 'RequestTimeoutError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

export class RequestEntityTooLargeError extends ServiceError {
  readonly statusCode = HttpErrorCodes.REQUEST_ENTITY_TOO_LARGE;
  readonly errorType = 'RequestEntityTooLargeError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

export class InternalServerError extends ServiceError {
  readonly statusCode = HttpErrorCodes.INTERNAL_SERVER_ERROR;
  readonly errorType = 'InternalServerError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

export class ServiceUnavailableError extends ServiceError {
  readonly statusCode = HttpErrorCodes.SERVICE_UNAVAILABLE;
  readonly errorType = 'ServiceUnavailableError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
  }
}

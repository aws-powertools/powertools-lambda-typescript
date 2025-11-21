import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { HandlerResponse, HttpStatusCode } from '../types/http.js';
import { HttpStatusCodes } from './constants.js';

class RouteMatchingError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly method: string
  ) {
    super(message);
    this.name = 'RouteMatchingError';
  }
}

class ParameterValidationError extends RouteMatchingError {
  constructor(public readonly issues: string[]) {
    super(`Parameter validation failed: ${issues.join(', ')}`, '', '');
    this.name = 'ParameterValidationError';
  }
}

abstract class HttpError extends Error {
  abstract readonly statusCode: HttpStatusCode;
  abstract readonly errorType: string;
  public readonly details?: Record<string, unknown>;

  protected constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options);
    this.name = 'HttpError';
    this.details = details;
  }

  toJSON(): HandlerResponse {
    return {
      statusCode: this.statusCode,
      error: this.errorType,
      message: this.message,
      ...(this.details && {
        details: this.details as Record<string, JSONValue>,
      }),
    };
  }
}

class BadRequestError extends HttpError {
  readonly statusCode = HttpStatusCodes.BAD_REQUEST;
  readonly errorType = 'BadRequestError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'BadRequestError';
  }
}

class UnauthorizedError extends HttpError {
  readonly statusCode = HttpStatusCodes.UNAUTHORIZED;
  readonly errorType = 'UnauthorizedError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends HttpError {
  readonly statusCode = HttpStatusCodes.FORBIDDEN;
  readonly errorType = 'ForbiddenError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends HttpError {
  readonly statusCode = HttpStatusCodes.NOT_FOUND;
  readonly errorType = 'NotFoundError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'NotFoundError';
  }
}

class MethodNotAllowedError extends HttpError {
  readonly statusCode = HttpStatusCodes.METHOD_NOT_ALLOWED;
  readonly errorType = 'MethodNotAllowedError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'MethodNotAllowedError';
  }
}

class RequestTimeoutError extends HttpError {
  readonly statusCode = HttpStatusCodes.REQUEST_TIMEOUT;
  readonly errorType = 'RequestTimeoutError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'RequestTimeoutError';
  }
}

class RequestEntityTooLargeError extends HttpError {
  readonly statusCode = HttpStatusCodes.REQUEST_ENTITY_TOO_LARGE;
  readonly errorType = 'RequestEntityTooLargeError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'RequestEntityTooLargeError';
  }
}

class InternalServerError extends HttpError {
  readonly statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
  readonly errorType = 'InternalServerError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'InternalServerError';
  }
}

class ServiceUnavailableError extends HttpError {
  readonly statusCode = HttpStatusCodes.SERVICE_UNAVAILABLE;
  readonly errorType = 'ServiceUnavailableError';

  constructor(
    message?: string,
    options?: ErrorOptions,
    details?: Record<string, unknown>
  ) {
    super(message, options, details);
    this.name = 'ServiceUnavailableError';
  }
}

class InvalidEventError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidEventError';
  }
}

class InvalidHttpMethodError extends Error {
  constructor(method: string) {
    super(`HTTP method ${method} is not supported.`);
    this.name = 'InvalidEventError';
  }
}

export {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  InvalidEventError,
  InvalidHttpMethodError,
  MethodNotAllowedError,
  NotFoundError,
  ParameterValidationError,
  RequestEntityTooLargeError,
  RequestTimeoutError,
  RouteMatchingError,
  HttpError,
  ServiceUnavailableError,
  UnauthorizedError,
};

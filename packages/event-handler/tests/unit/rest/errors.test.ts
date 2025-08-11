import { describe, expect, it } from 'vitest';
import { HttpErrorCodes } from '../../../src/rest/constants.js';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  RequestEntityTooLargeError,
  RequestTimeoutError,
  ServiceUnavailableError,
  UnauthorizedError,
} from '../../../src/rest/errors.js';

describe('HTTP Error Classes', () => {
  it.each([
    {
      ErrorClass: BadRequestError,
      errorType: 'BadRequestError',
      statusCode: HttpErrorCodes.BAD_REQUEST,
      customMessage: 'Invalid input',
    },
    {
      ErrorClass: UnauthorizedError,
      errorType: 'UnauthorizedError',
      statusCode: HttpErrorCodes.UNAUTHORIZED,
      customMessage: 'Token expired',
    },
    {
      ErrorClass: ForbiddenError,
      errorType: 'ForbiddenError',
      statusCode: HttpErrorCodes.FORBIDDEN,
      customMessage: 'Access denied',
    },
    {
      ErrorClass: NotFoundError,
      errorType: 'NotFoundError',
      statusCode: HttpErrorCodes.NOT_FOUND,
      customMessage: 'Resource not found',
    },
    {
      ErrorClass: MethodNotAllowedError,
      errorType: 'MethodNotAllowedError',
      statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
      customMessage: 'POST not allowed',
    },
    {
      ErrorClass: RequestTimeoutError,
      errorType: 'RequestTimeoutError',
      statusCode: HttpErrorCodes.REQUEST_TIMEOUT,
      customMessage: 'Operation timed out',
    },
    {
      ErrorClass: RequestEntityTooLargeError,
      errorType: 'RequestEntityTooLargeError',
      statusCode: HttpErrorCodes.REQUEST_ENTITY_TOO_LARGE,
      customMessage: 'File too large',
    },
    {
      ErrorClass: InternalServerError,
      errorType: 'InternalServerError',
      statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
      customMessage: 'Database connection failed',
    },
    {
      ErrorClass: ServiceUnavailableError,
      errorType: 'ServiceUnavailableError',
      statusCode: HttpErrorCodes.SERVICE_UNAVAILABLE,
      customMessage: 'Maintenance mode',
    },
  ])(
    '$errorType uses custom message when provided',
    ({ ErrorClass, errorType, statusCode, customMessage }) => {
      const error = new ErrorClass(customMessage);
      expect(error.message).toBe(customMessage);
      expect(error.statusCode).toBe(statusCode);
      expect(error.errorType).toBe(errorType);
    }
  );

  describe('toJSON', () => {
    it.each([
      {
        ErrorClass: BadRequestError,
        errorType: 'BadRequestError',
        statusCode: HttpErrorCodes.BAD_REQUEST,
        message: 'Invalid input',
      },
      {
        ErrorClass: UnauthorizedError,
        errorType: 'UnauthorizedError',
        statusCode: HttpErrorCodes.UNAUTHORIZED,
        message: 'Token expired',
      },
      {
        ErrorClass: ForbiddenError,
        errorType: 'ForbiddenError',
        statusCode: HttpErrorCodes.FORBIDDEN,
        message: 'Access denied',
      },
      {
        ErrorClass: NotFoundError,
        errorType: 'NotFoundError',
        statusCode: HttpErrorCodes.NOT_FOUND,
        message: 'Resource not found',
      },
      {
        ErrorClass: MethodNotAllowedError,
        errorType: 'MethodNotAllowedError',
        statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
        message: 'POST not allowed',
      },
      {
        ErrorClass: RequestTimeoutError,
        errorType: 'RequestTimeoutError',
        statusCode: HttpErrorCodes.REQUEST_TIMEOUT,
        message: 'Operation timed out',
      },
      {
        ErrorClass: RequestEntityTooLargeError,
        errorType: 'RequestEntityTooLargeError',
        statusCode: HttpErrorCodes.REQUEST_ENTITY_TOO_LARGE,
        message: 'File too large',
      },
      {
        ErrorClass: InternalServerError,
        errorType: 'InternalServerError',
        statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Database connection failed',
      },
      {
        ErrorClass: ServiceUnavailableError,
        errorType: 'ServiceUnavailableError',
        statusCode: HttpErrorCodes.SERVICE_UNAVAILABLE,
        message: 'Maintenance mode',
      },
    ])(
      '$errorType serializes to JSON format',
      ({ ErrorClass, errorType, statusCode, message }) => {
        const error = new ErrorClass(message);
        const json = error.toJSON();

        expect(json).toEqual({
          statusCode,
          error: errorType,
          message,
        });
      }
    );

    it('includes details in JSON when provided', () => {
      const details = { field: 'value', code: 'VALIDATION_ERROR' };
      const error = new BadRequestError('Invalid input', undefined, details);
      const json = error.toJSON();

      expect(json).toEqual({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'BadRequestError',
        message: 'Invalid input',
        details,
      });
    });

    it('excludes details from JSON when not provided', () => {
      const error = new BadRequestError('Invalid input');
      const json = error.toJSON();

      expect(json).toEqual({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'BadRequestError',
        message: 'Invalid input',
      });
      expect(json).not.toHaveProperty('details');
    });
  });

  it('passes options to Error superclass', () => {
    const cause = new Error('Root cause');
    const error = new BadRequestError('Invalid input', { cause });

    expect(error.cause).toBe(cause);
  });
});

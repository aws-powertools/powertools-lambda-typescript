import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BadRequestError,
  ForbiddenError,
  HttpStatusCodes,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  RequestEntityTooLargeError,
  RequestTimeoutError,
  RequestValidationError,
  ResponseValidationError,
  ServiceUnavailableError,
  UnauthorizedError,
} from '../../../src/http/index.js';

describe('HTTP Error Classes', () => {
  it.each([
    {
      ErrorClass: BadRequestError,
      errorType: 'BadRequestError',
      statusCode: HttpStatusCodes.BAD_REQUEST,
      customMessage: 'Invalid input',
    },
    {
      ErrorClass: UnauthorizedError,
      errorType: 'UnauthorizedError',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
      customMessage: 'Token expired',
    },
    {
      ErrorClass: ForbiddenError,
      errorType: 'ForbiddenError',
      statusCode: HttpStatusCodes.FORBIDDEN,
      customMessage: 'Access denied',
    },
    {
      ErrorClass: NotFoundError,
      errorType: 'NotFoundError',
      statusCode: HttpStatusCodes.NOT_FOUND,
      customMessage: 'Resource not found',
    },
    {
      ErrorClass: MethodNotAllowedError,
      errorType: 'MethodNotAllowedError',
      statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
      customMessage: 'POST not allowed',
    },
    {
      ErrorClass: RequestTimeoutError,
      errorType: 'RequestTimeoutError',
      statusCode: HttpStatusCodes.REQUEST_TIMEOUT,
      customMessage: 'Operation timed out',
    },
    {
      ErrorClass: RequestEntityTooLargeError,
      errorType: 'RequestEntityTooLargeError',
      statusCode: HttpStatusCodes.REQUEST_ENTITY_TOO_LARGE,
      customMessage: 'File too large',
    },
    {
      ErrorClass: InternalServerError,
      errorType: 'InternalServerError',
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      customMessage: 'Database connection failed',
    },
    {
      ErrorClass: ServiceUnavailableError,
      errorType: 'ServiceUnavailableError',
      statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
      customMessage: 'Maintenance mode',
    },
  ])('$errorType uses custom message when provided', ({
    ErrorClass,
    errorType,
    statusCode,
    customMessage,
  }) => {
    const error = new ErrorClass(customMessage);
    expect(error.message).toBe(customMessage);
    expect(error.statusCode).toBe(statusCode);
    expect(error.errorType).toBe(errorType);
  });

  describe('toJSON', () => {
    it.each([
      {
        ErrorClass: BadRequestError,
        errorType: 'BadRequestError',
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: 'Invalid input',
      },
      {
        ErrorClass: UnauthorizedError,
        errorType: 'UnauthorizedError',
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: 'Token expired',
      },
      {
        ErrorClass: ForbiddenError,
        errorType: 'ForbiddenError',
        statusCode: HttpStatusCodes.FORBIDDEN,
        message: 'Access denied',
      },
      {
        ErrorClass: NotFoundError,
        errorType: 'NotFoundError',
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: 'Resource not found',
      },
      {
        ErrorClass: MethodNotAllowedError,
        errorType: 'MethodNotAllowedError',
        statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
        message: 'POST not allowed',
      },
      {
        ErrorClass: RequestTimeoutError,
        errorType: 'RequestTimeoutError',
        statusCode: HttpStatusCodes.REQUEST_TIMEOUT,
        message: 'Operation timed out',
      },
      {
        ErrorClass: RequestEntityTooLargeError,
        errorType: 'RequestEntityTooLargeError',
        statusCode: HttpStatusCodes.REQUEST_ENTITY_TOO_LARGE,
        message: 'File too large',
      },
      {
        ErrorClass: InternalServerError,
        errorType: 'InternalServerError',
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Database connection failed',
      },
      {
        ErrorClass: ServiceUnavailableError,
        errorType: 'ServiceUnavailableError',
        statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
        message: 'Maintenance mode',
      },
    ])('$errorType serializes to JSON format', ({
      ErrorClass,
      errorType,
      statusCode,
      message,
    }) => {
      const error = new ErrorClass(message);
      const json = error.toJSON();

      expect(json).toEqual({
        statusCode,
        error: errorType,
        message,
      });
    });

    it('includes details in JSON when provided', () => {
      const details = { field: 'value', code: 'VALIDATION_ERROR' };
      const error = new BadRequestError('Invalid input', undefined, details);
      const json = error.toJSON();

      expect(json).toEqual({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        error: 'BadRequestError',
        message: 'Invalid input',
        details,
      });
    });

    it('excludes details from JSON when not provided', () => {
      const error = new BadRequestError('Invalid input');
      const json = error.toJSON();

      expect(json).toEqual({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        error: 'BadRequestError',
        message: 'Invalid input',
      });
      expect(json).not.toHaveProperty('details');
    });
  });

  describe('toWebResponse', () => {
    it.each([
      {
        ErrorClass: BadRequestError,
        errorType: 'BadRequestError',
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: 'Invalid input',
      },
      {
        ErrorClass: UnauthorizedError,
        errorType: 'UnauthorizedError',
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        message: 'Token expired',
      },
      {
        ErrorClass: ForbiddenError,
        errorType: 'ForbiddenError',
        statusCode: HttpStatusCodes.FORBIDDEN,
        message: 'Access denied',
      },
      {
        ErrorClass: NotFoundError,
        errorType: 'NotFoundError',
        statusCode: HttpStatusCodes.NOT_FOUND,
        message: 'Resource not found',
      },
      {
        ErrorClass: MethodNotAllowedError,
        errorType: 'MethodNotAllowedError',
        statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
        message: 'POST not allowed',
      },
      {
        ErrorClass: RequestTimeoutError,
        errorType: 'RequestTimeoutError',
        statusCode: HttpStatusCodes.REQUEST_TIMEOUT,
        message: 'Operation timed out',
      },
      {
        ErrorClass: RequestEntityTooLargeError,
        errorType: 'RequestEntityTooLargeError',
        statusCode: HttpStatusCodes.REQUEST_ENTITY_TOO_LARGE,
        message: 'File too large',
      },
      {
        ErrorClass: InternalServerError,
        errorType: 'InternalServerError',
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Database connection failed',
      },
      {
        ErrorClass: ServiceUnavailableError,
        errorType: 'ServiceUnavailableError',
        statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
        message: 'Maintenance mode',
      },
    ])('$errorType creates Response object', async ({
      ErrorClass,
      errorType,
      statusCode,
      message,
    }) => {
      const error = new ErrorClass(message);
      const response = error.toWebResponse();

      expect(response.status).toEqual(statusCode);
      expect(response.headers.get('Content-Type')).toEqual('application/json');

      await expect(response.json()).resolves.toEqual({
        statusCode,
        error: errorType,
        message,
      });
    });

    it('includes details in Response body when provided', async () => {
      const details = { field: 'value', code: 'VALIDATION_ERROR' };
      const error = new BadRequestError('Invalid input', undefined, details);
      const response = error.toWebResponse();

      expect(response.status).toEqual(HttpStatusCodes.BAD_REQUEST);

      await expect(response.json()).resolves.toEqual({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        error: 'BadRequestError',
        message: 'Invalid input',
        details,
      });
    });

    it('excludes details from JSON when not provided', async () => {
      const error = new BadRequestError('Invalid input');
      const response = error.toWebResponse();

      expect(response.status).toEqual(HttpStatusCodes.BAD_REQUEST);

      await expect(response.json()).resolves.toEqual({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        error: 'BadRequestError',
        message: 'Invalid input',
      });
      expect(response).not.toHaveProperty('details');
    });
  });

  it('passes options to Error superclass', () => {
    const cause = new Error('Root cause');
    const error = new BadRequestError('Invalid input', { cause });

    expect(error.cause).toBe(cause);
  });

  describe('RequestValidationError', () => {
    it('creates error with correct statusCode', () => {
      const error = new RequestValidationError(
        'Validation failed for request body',
        'body'
      );

      expect(error.statusCode).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(error.statusCode).toBe(422);
    });

    it('creates error with correct errorType', () => {
      const error = new RequestValidationError(
        'Validation failed for request body',
        'body'
      );

      expect(error.errorType).toBe('RequestValidationError');
      expect(error.name).toBe('RequestValidationError');
    });

    it('stores component information', () => {
      const error = new RequestValidationError(
        'Validation failed for request headers',
        'headers'
      );

      expect(error.component).toBe('headers');
    });

    it('stores original error', () => {
      const originalError = new Error('Schema validation failed');
      const error = new RequestValidationError(
        'Validation failed for request body',
        'body',
        originalError
      );

      expect(error.originalError).toBe(originalError);
      expect(error.cause).toBe(originalError);
    });

    it('includes validation error in details when POWERTOOLS_DEV is true', () => {
      process.env.POWERTOOLS_DEV = 'true';
      const originalError = new Error('Schema validation failed');
      const error = new RequestValidationError(
        'Validation failed for request body',
        'body',
        originalError
      );

      expect(error.details).toHaveProperty('validationError');
      expect(error.details?.validationError).toBe('Schema validation failed');
    });

    it('excludes validation error details when POWERTOOLS_DEV is false', () => {
      delete process.env.POWERTOOLS_DEV;
      const originalError = new Error('Schema validation failed');
      const error = new RequestValidationError(
        'Validation failed for request body',
        'body',
        originalError
      );

      expect(error.details).toBeUndefined();
    });

    it('supports all request components', () => {
      const components: Array<'body' | 'headers' | 'path' | 'query'> = [
        'body',
        'headers',
        'path',
        'query',
      ];

      for (const component of components) {
        const error = new RequestValidationError(
          `Validation failed for request ${component}`,
          component
        );
        expect(error.component).toBe(component);
      }
    });

    it('converts to JSON response', () => {
      const error = new RequestValidationError(
        'Validation failed for request body',
        'body'
      );

      const json = error.toJSON();
      expect(json).toEqual({
        statusCode: 422,
        error: 'RequestValidationError',
        message: 'Validation failed for request body',
      });
    });
  });

  describe('ResponseValidationError', () => {
    beforeEach(() => {
      delete process.env.POWERTOOLS_DEV;
    });

    afterEach(() => {
      delete process.env.POWERTOOLS_DEV;
    });

    it('creates error with correct statusCode', () => {
      const error = new ResponseValidationError(
        'Validation failed for response body',
        'body'
      );

      expect(error.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('creates error with correct errorType', () => {
      const error = new ResponseValidationError(
        'Validation failed for response body',
        'body'
      );

      expect(error.errorType).toBe('ResponseValidationError');
      expect(error.name).toBe('ResponseValidationError');
    });

    it('stores component information', () => {
      const error = new ResponseValidationError(
        'Validation failed for response headers',
        'headers'
      );

      expect(error.component).toBe('headers');
    });

    it('stores original error', () => {
      const originalError = new Error('Schema validation failed');
      const error = new ResponseValidationError(
        'Validation failed for response body',
        'body',
        originalError
      );

      expect(error.originalError).toBe(originalError);
      expect(error.cause).toBe(originalError);
    });

    it('includes validation error in details when POWERTOOLS_DEV is true', () => {
      process.env.POWERTOOLS_DEV = 'true';
      const originalError = new Error('Schema validation failed');
      const error = new ResponseValidationError(
        'Validation failed for response body',
        'body',
        originalError
      );

      expect(error.details).toHaveProperty('validationError');
      expect(error.details?.validationError).toBe('Schema validation failed');
    });

    it('excludes validation error details when POWERTOOLS_DEV is false', () => {
      delete process.env.POWERTOOLS_DEV;
      const originalError = new Error('Schema validation failed');
      const error = new ResponseValidationError(
        'Validation failed for response body',
        'body',
        originalError
      );

      expect(error.details).toBeUndefined();
    });

    it('supports all response components', () => {
      const components: Array<'body' | 'headers'> = ['body', 'headers'];

      for (const component of components) {
        const error = new ResponseValidationError(
          `Validation failed for response ${component}`,
          component
        );
        expect(error.component).toBe(component);
      }
    });

    it('converts to JSON response', () => {
      const error = new ResponseValidationError(
        'Validation failed for response body',
        'body'
      );

      const json = error.toJSON();
      expect(json).toEqual({
        statusCode: 500,
        error: 'ResponseValidationError',
        message: 'Validation failed for response body',
      });
    });
  });
});

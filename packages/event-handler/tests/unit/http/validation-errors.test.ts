import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  HttpStatusCodes,
  RequestValidationError,
  ResponseValidationError,
} from '../../../src/rest/index.js';

describe('Validation Error Classes', () => {
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

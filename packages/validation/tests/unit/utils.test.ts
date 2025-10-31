import { expect, it } from 'vitest';
import { SchemaValidationError } from '../../src/errors.js';
import { getErrorCause } from '../../src/utils.js';

it('gets the original cause of the error if it is a SchemaValidationError', () => {
  const cause = getErrorCause(
    new SchemaValidationError('Schema validation failed', {
      cause: 'Original cause',
    })
  );
  expect(cause).toBe('Original cause');
});

it('gets the error itself if it is any error other than SchemaValidationError', () => {
  const error = new Error('test-error');
  const cause = getErrorCause(error);
  expect(cause).toBe(error);
});

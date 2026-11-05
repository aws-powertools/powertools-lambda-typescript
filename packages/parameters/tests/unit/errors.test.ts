import { describe, expect, it } from 'vitest';
import { AppConfigAgentError, GetParameterError } from '../../src/errors.js';

describe('Class: AppConfigAgentError', () => {
  it('sets the message, status code, and name', () => {
    // Prepare
    const message = 'Agent unavailable';
    const statusCode = 503;

    // Act
    const error = new AppConfigAgentError(message, statusCode);

    // Assess
    expect(error).toBeInstanceOf(GetParameterError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.name).toBe('AppConfigAgentError');
  });

  it('preserves the original cause', () => {
    // Prepare
    const cause = new Error('Original error');

    // Act
    const error = new AppConfigAgentError('Agent unavailable', 503, { cause });

    // Assess
    expect(error.cause).toBe(cause);
  });
});

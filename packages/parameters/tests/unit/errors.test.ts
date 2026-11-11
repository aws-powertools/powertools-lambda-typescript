import { describe, expect, it } from 'vitest';
import {
  AppConfigAgentError,
  FlagNotFoundError,
  GetParameterError,
  ParameterNotFoundError,
} from '../../src/errors.js';

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

describe('Class: FlagNotFoundError', () => {
  it('sets the message, missing flags, and name', () => {
    // Prepare
    const message = 'One or more flags not found in configuration my-config';
    const flags = ['missing_flag', 'another_missing_flag'] as const;

    // Act
    const error = new FlagNotFoundError(message, flags);

    // Assess
    expect(error).toBeInstanceOf(ParameterNotFoundError);
    expect(error).toBeInstanceOf(GetParameterError);
    expect(error.message).toBe(message);
    expect(error.flags).toStrictEqual(flags);
    expect(error.name).toBe('FlagNotFoundError');
    expect(error).not.toHaveProperty('cause');
  });

  it('preserves the original cause', () => {
    // Prepare
    const cause = new Error('Original error');

    // Act
    const error = new FlagNotFoundError('Flags not found', ['missing_flag'], {
      cause,
    });

    // Assess
    expect(error.cause).toBe(cause);
  });
});

import { describe, expect, it } from 'vitest';
import {
  RequestSigningError,
  SignerConfigError,
  SignerError,
} from '../../src/errors.js';

describe('Signer errors', () => {
  it('SignerError sets its name and message', () => {
    // Act
    const error = new SignerError('boom');

    // Assess
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SignerError');
    expect(error.message).toBe('boom');
  });

  it('SignerConfigError extends SignerError', () => {
    // Act
    const error = new SignerConfigError('missing region');

    // Assess
    expect(error).toBeInstanceOf(SignerError);
    expect(error.name).toBe('SignerConfigError');
  });

  it('RequestSigningError extends SignerError', () => {
    // Act
    const error = new RequestSigningError('failed');

    // Assess
    expect(error).toBeInstanceOf(SignerError);
    expect(error.name).toBe('RequestSigningError');
  });

  it('RequestSigningError appends the cause message when the cause is an Error', () => {
    // Prepare
    const cause = new Error('underlying problem');

    // Act
    const error = new RequestSigningError('failed', { cause });

    // Assess
    expect(error.message).toBe(
      'failed. This error was caused by: underlying problem.'
    );
    expect(error.cause).toBe(cause);
  });

  it('RequestSigningError keeps the message as-is when there is no Error cause', () => {
    // Act
    const error = new RequestSigningError('failed');

    // Assess
    expect(error.message).toBe('failed');
  });
});

import { describe, expect, it } from 'vitest';
import {
  FeatureFlagsError,
  FlagResultValidationError,
  FlagValueTypeError,
  InvalidContextError,
  StoreUnavailableError,
} from '../../src/index.js';

describe('Feature flags errors', () => {
  it.each([
    { path: undefined, rendered: '(root)' },
    { path: [], rendered: '(root)' },
    { path: ['settings', { key: 'theme' }, 0], rendered: 'settings.theme.0' },
    {
      path: [Symbol('field'), { key: Symbol('nested') }],
      rendered: 'Symbol(field).Symbol(nested)',
    },
  ])('renders validation issue path $rendered', ({ path, rendered }) => {
    // Prepare
    const issues = [{ message: 'secret-validator-value', path }];
    // Act
    const error = new FlagResultValidationError('settings', 'result', issues);
    // Assess
    expect(error.message).toBe(
      `Flag 'settings' result failed schema validation at ${rendered}`
    );
    expect(error.name).toBe('FlagResultValidationError');
    expect(error.flag).toBe('settings');
    expect(error.source).toBe('result');
    expect(error.cause).toBe(issues);
    expect(error).toBeInstanceOf(FeatureFlagsError);
    expect(error).toBeInstanceOf(Error);
  });

  it('joins validation issue paths without including messages', () => {
    // Prepare
    const issues = [
      { message: 'secret-validator-value', path: ['theme'] },
      { message: 'secret-other-value', path: [{ key: 'limit' }] },
      { message: 'secret-root-value' },
    ];
    // Act
    const error = new FlagResultValidationError('settings', 'fallback', issues);
    // Assess
    expect(error.message).toBe(
      "Flag 'settings' fallback failed schema validation at theme, limit, (root)"
    );
    expect(error.cause).toBe(issues);
  });

  it.each([
    FeatureFlagsError,
    FlagValueTypeError,
    InvalidContextError,
    StoreUnavailableError,
  ])('sets the name and message for %s', (ErrorClass) => {
    // Prepare
    const message = 'Store failed';

    // Act
    const error = new ErrorClass(message);

    // Assess
    expect(error.name).toBe(ErrorClass.name);
    expect(error.message).toBe(message);
  });

  it.each([
    FeatureFlagsError,
    FlagValueTypeError,
    InvalidContextError,
    StoreUnavailableError,
  ])('preserves the cause for %s', (ErrorClass) => {
    // Prepare
    const cause = new Error('Connection failed');

    // Act
    const error = new ErrorClass('Store failed', { cause });

    // Assess
    expect(error.cause).toBe(cause);
  });

  it.each([
    FeatureFlagsError,
    FlagValueTypeError,
    InvalidContextError,
    StoreUnavailableError,
  ])('inherits from FeatureFlagsError and Error for %s', (ErrorClass) => {
    // Prepare
    const message = 'Store failed';

    // Act
    const error = new ErrorClass(message);

    // Assess
    expect(error).toBeInstanceOf(ErrorClass);
    expect(error).toBeInstanceOf(FeatureFlagsError);
    expect(error).toBeInstanceOf(Error);
  });
});

import { describe, expect, it } from 'vitest';
import { FeatureFlagsError, StoreUnavailableError } from '../../src/index.js';

describe('Feature flags errors', () => {
  it.each([FeatureFlagsError, StoreUnavailableError])(
    'sets the name and message for %s',
    (ErrorClass) => {
      // Prepare
      const message = 'Store failed';

      // Act
      const error = new ErrorClass(message);

      // Assess
      expect(error.name).toBe(ErrorClass.name);
      expect(error.message).toBe(message);
    }
  );

  it.each([FeatureFlagsError, StoreUnavailableError])(
    'preserves the cause for %s',
    (ErrorClass) => {
      // Prepare
      const cause = new Error('Connection failed');

      // Act
      const error = new ErrorClass('Store failed', { cause });

      // Assess
      expect(error.cause).toBe(cause);
    }
  );

  it.each([FeatureFlagsError, StoreUnavailableError])(
    'inherits from FeatureFlagsError and Error for %s',
    (ErrorClass) => {
      // Prepare
      const message = 'Store failed';

      // Act
      const error = new ErrorClass(message);

      // Assess
      expect(error).toBeInstanceOf(ErrorClass);
      expect(error).toBeInstanceOf(FeatureFlagsError);
      expect(error).toBeInstanceOf(Error);
    }
  );
});

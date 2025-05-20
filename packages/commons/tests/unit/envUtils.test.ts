import { beforeEach, describe, expect, it } from 'vitest';
import {
  getBooleanFromEnv,
  getFalsyBooleanFromEnv,
  getNumberFromEnv,
  getServiceName,
  getStringFromEnv,
  getTruthyBooleanFromEnv,
  getXRayTraceIdFromEnv,
  isDevMode,
  isRequestXRaySampled,
} from '../../src/envUtils.js';

describe('Functions: envUtils', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  describe('Function: getStringFromEnv', () => {
    it('returns the value of the environment variable', () => {
      // Prepare
      process.env.TEST_ENV = 'testValue';

      // Act
      const result = getStringFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe('testValue');
    });

    it('returns the default value if the environment variable is not set', () => {
      // Prepare
      process.env.TEST_ENV = undefined;

      // Act
      const result = getStringFromEnv({
        key: 'TEST_ENV',
        defaultValue: 'defaultValue',
      });

      // Assess
      expect(result).toBe('defaultValue');
    });

    it('throws an error if the environment variable is not set', () => {
      // Prepare
      process.env.TEST_ENV = undefined;

      // Act & Assess
      expect(() => getStringFromEnv({ key: 'TEST_ENV' })).toThrowError(
        'Environment variable TEST_ENV is required'
      );
    });

    it('returns the trimmed value of the environment variable', () => {
      // Prepare
      process.env.TEST_ENV = '   testValue   ';

      // Act
      const result = getStringFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe('testValue');
    });

    it('uses the provided error message if the environment variable is not set', () => {
      // Prepare
      process.env.TEST_ENV = undefined;

      // Act & Assess
      expect(() =>
        getStringFromEnv({
          key: 'TEST_ENV',
          errorMessage: 'Custom error message',
        })
      ).toThrowError('Custom error message');
    });
  });

  describe('Function: getNumberFromEnv', () => {
    it('returns the value of the environment variable as a number', () => {
      // Prepare
      process.env.TEST_ENV = '123';

      // Act
      const result = getNumberFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe(123);
    });

    it('returns the default value if the environment variable is not set', () => {
      // Prepare
      process.env.TEST_ENV = undefined;

      // Act
      const result = getNumberFromEnv({
        key: 'TEST_ENV',
        defaultValue: 456,
      });

      // Assess
      expect(result).toBe(456);
    });

    it('throws an error if the environment variable is not a number', () => {
      // Prepare
      process.env.TEST_ENV = 'notANumber';

      // Act & Assess
      expect(() => getNumberFromEnv({ key: 'TEST_ENV' })).toThrowError(
        'Environment variable TEST_ENV must be a number'
      );
    });
  });

  describe('Function: getBooleanFromEnv', () => {
    it('returns true if the environment variable is set to a truthy value', () => {
      // Prepare
      process.env.TEST_ENV = 'true';

      // Act
      const result = getBooleanFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe(true);
    });

    it('returns false if the environment variable is set to a falsy value', () => {
      // Prepare
      process.env.TEST_ENV = 'false';

      // Act
      const result = getBooleanFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe(false);
    });

    it('returns the default value if the environment variable is not set', () => {
      // Prepare
      process.env.TEST_ENV = undefined;

      // Act
      const result = getBooleanFromEnv({
        key: 'TEST_ENV',
        defaultValue: true,
      });

      // Assess
      expect(result).toBe(true);
    });

    it('throws an error if the environment variable value is not a boolean', () => {
      // Prepare
      process.env.TEST_ENV = 'notABoolean';

      // Act & Assess
      expect(() => getBooleanFromEnv({ key: 'TEST_ENV' })).toThrowError(
        'Environment variable TEST_ENV must be a boolean'
      );
    });
  });

  describe('Function: getTruthyBooleanFromEnv', () => {
    it.each([
      ['1', true],
      ['y', true],
      ['yes', true],
      ['t', true],
      ['TRUE', true],
      ['on', true],
    ])(
      'returns true if the environment variable is set to a truthy value: %s',
      (value, expected) => {
        // Prepare
        process.env.TEST_ENV = value;

        // Act
        const result = getTruthyBooleanFromEnv({ key: 'TEST_ENV' });

        // Assess
        expect(result).toBe(expected);
      }
    );

    it.each([
      ['', false],
      ['false', false],
      ['fasle', false],
      ['somethingsilly', false],
      ['0', false],
    ])(
      'returns false if the environment variable is set to a falsy value: %s',
      (value, expected) => {
        // Prepare
        process.env.TEST_ENV = value;

        // Act
        const result = getTruthyBooleanFromEnv({ key: 'TEST_ENV' });

        // Assess
        expect(result).toBe(expected);
      }
    );

    it('returns the default value if the environment variable is not set', () => {
      // Prepare
      process.env.TEST_ENV = undefined;

      // Act
      const result = getTruthyBooleanFromEnv({
        key: 'TEST_ENV',
        defaultValue: true,
      });

      // Assess
      expect(result).toBe(true);
    });
  });

  describe('Function: getFalsyBooleanFromEnv', () => {
    it.each([
      ['0', true],
      ['n', true],
      ['no', true],
      ['f', true],
      ['FALSE', true],
      ['off', true],
    ])(
      'returns true if the environment variable is set to a truthy value: %s',
      (value, expected) => {
        // Prepare
        process.env.TEST_ENV = value;

        // Act
        const result = getFalsyBooleanFromEnv({ key: 'TEST_ENV' });

        // Assess
        expect(result).toBe(expected);
      }
    );

    it.each([
      ['1', false],
      ['y', false],
      ['yes', false],
      ['t', false],
      ['TRUE', false],
      ['on', false],
      ['', false],
      ['somethingsilly', false],
    ])(
      'returns false if the environment variable is set to a falsy value: %s',
      (value, expected) => {
        // Prepare
        process.env.TEST_ENV = value;

        // Act
        const result = getFalsyBooleanFromEnv({ key: 'TEST_ENV' });

        // Assess
        expect(result).toBe(expected);
      }
    );

    it('returns the default value if the environment variable is not set', () => {
      // Prepare
      process.env.TEST_ENV = undefined;

      // Act
      const result = getFalsyBooleanFromEnv({
        key: 'TEST_ENV',
        defaultValue: false,
      });

      // Assess
      expect(result).toBe(true);
    });
  });

  describe('Function: isDevMode', () => {
    it('returns true if the environment variable is set to a truthy value', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'true';

      // Act
      const result = isDevMode();

      // Assess
      expect(result).toBe(true);
    });

    it('returns false if the environment variable is set to a falsy value', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'false';

      // Act
      const result = isDevMode();

      // Assess
      expect(result).toBe(false);
    });

    it('returns false if the environment variable is not set', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = undefined;

      // Act
      const result = isDevMode();

      // Assess
      expect(result).toBe(false);
    });
  });

  describe('Function: getServiceName', () => {
    it('returns the service name from the environment variable', () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = 'testService';

      // Act
      const result = getServiceName();

      // Assess
      expect(result).toBe('testService');
    });

    it('returns an empty string if the environment variable is not set', () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = undefined;

      // Act
      const result = getServiceName();

      // Assess
      expect(result).toBe('');
    });
  });

  describe('Function: getXrayTraceIdFromEnv', () => {
    it('returns the value of the environment variable _X_AMZN_TRACE_ID', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID = 'abcd123456789';

      // Act
      const value = getXRayTraceIdFromEnv();

      // Assess
      expect(value).toEqual('abcd123456789');
    });

    it('returns the value of the Root X-Ray segment ID properly formatted', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID =
        'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1';

      // Act
      const value = getXRayTraceIdFromEnv();

      // Assess
      expect(value).toEqual('1-5759e988-bd862e3fe1be46a994272793');
    });
  });

  describe('Function: isRequestXRaySampled', () => {
    it('returns true if the Sampled flag is set in the _X_AMZN_TRACE_ID environment variable', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID =
        'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1';

      // Act
      const value = isRequestXRaySampled();

      // Assess
      expect(value).toEqual(true);
    });

    it('returns false if the Sampled flag is not set in the _X_AMZN_TRACE_ID environment variable', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID =
        'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047';

      // Act
      const value = isRequestXRaySampled();

      // Assess
      expect(value).toEqual(false);
    });

    it('returns false when no _X_AMZN_TRACE_ID environment variable is present', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID = undefined;

      // Act
      const value = isRequestXRaySampled();

      // Assess
      expect(value).toEqual(false);
    });
  });
});

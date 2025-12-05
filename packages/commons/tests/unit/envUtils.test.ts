import { InvokeStore, InvokeStoreBase } from '@aws/lambda-invoke-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getBooleanFromEnv,
  getNumberFromEnv,
  getServiceName,
  getStringFromEnv,
  getXRayTraceIdFromEnv,
  isDevMode,
  isRequestXRaySampled,
  shouldUseInvokeStore,
} from '../../src/envUtils.js';

describe('Functions: envUtils', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
    vi.unstubAllEnvs();
  });

  describe('Function: getStringFromEnv', () => {
    it('returns the value of the environment variable', () => {
      // Prepare
      vi.stubEnv('TEST_ENV', 'testValue');

      // Act
      const result = getStringFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe('testValue');
    });

    it('returns the default value if the environment variable is not set', () => {
      // Act
      const result = getStringFromEnv({
        key: 'TEST_ENV',
        defaultValue: 'defaultValue',
      });

      // Assess
      expect(result).toBe('defaultValue');
    });

    it('throws an error if the environment variable is not set', () => {
      // Act & Assess
      expect(() => getStringFromEnv({ key: 'TEST_ENV' })).toThrowError(
        'Environment variable TEST_ENV is required'
      );
    });

    it('returns the trimmed value of the environment variable', () => {
      // Prepare
      vi.stubEnv('TEST_ENV', '   testValue   ');

      // Act
      const result = getStringFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe('testValue');
    });

    it('uses the provided error message if the environment variable is not set', () => {
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
      vi.stubEnv('TEST_ENV', '123');

      // Act
      const result = getNumberFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe(123);
    });

    it('returns the default value if the environment variable is not set', () => {
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
      vi.stubEnv('TEST_ENV', 'notANumber');

      // Act & Assess
      expect(() => getNumberFromEnv({ key: 'TEST_ENV' })).toThrowError(
        'Environment variable TEST_ENV must be a number'
      );
    });
  });

  describe('Function: getBooleanFromEnv', () => {
    it('returns true if the environment variable is set to a truthy value', () => {
      // Prepare
      vi.stubEnv('TEST_ENV', 'true');

      // Act
      const result = getBooleanFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe(true);
    });

    it('returns false if the environment variable is set to a falsy value', () => {
      // Prepare
      vi.stubEnv('TEST_ENV', 'false');

      // Act
      const result = getBooleanFromEnv({ key: 'TEST_ENV' });

      // Assess
      expect(result).toBe(false);
    });

    it('returns the default value if the environment variable is not set', () => {
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
      vi.stubEnv('TEST_ENV', 'notABoolean');

      // Act & Assess
      expect(() => getBooleanFromEnv({ key: 'TEST_ENV' })).toThrowError(
        'Environment variable TEST_ENV must be a boolean'
      );
    });

    it.each([
      ['1', true],
      ['y', true],
      ['yes', true],
      ['t', true],
      ['TRUE', true],
      ['on', true],
    ])('returns true if the environment variable is set to a truthy value: %s', (value, expected) => {
      // Prepare
      vi.stubEnv('TEST_ENV', value);

      // Act
      const result = getBooleanFromEnv({
        key: 'TEST_ENV',
        extendedParsing: true,
      });

      // Assess
      expect(result).toBe(expected);
    });

    it.each([
      ['0', false],
      ['n', false],
      ['no', false],
      ['f', false],
      ['FALSE', false],
      ['off', false],
    ])('returns false if the environment variable is set to a falsy value: %s', (value, expected) => {
      // Prepare
      vi.stubEnv('TEST_ENV', value);

      // Act
      const result = getBooleanFromEnv({
        key: 'TEST_ENV',
        extendedParsing: true,
      });

      // Assess
      expect(result).toBe(expected);
    });
  });

  describe('Function: isDevMode', () => {
    it('returns true if the environment variable is set to a truthy value', () => {
      // Prepare
      vi.stubEnv('POWERTOOLS_DEV', 'true');

      // Act
      const result = isDevMode();

      // Assess
      expect(result).toBe(true);
    });

    it('returns false if the environment variable is set to a falsy value', () => {
      // Prepare
      vi.stubEnv('POWERTOOLS_DEV', 'false');

      // Act
      const result = isDevMode();

      // Assess
      expect(result).toBe(false);
    });

    it('returns false if the environment variable is not set', () => {
      // Act
      const result = isDevMode();

      // Assess
      expect(result).toBe(false);
    });
  });

  describe('Function: getServiceName', () => {
    it('returns the service name from the environment variable', () => {
      // Prepare
      vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'testService');

      // Act
      const result = getServiceName();

      // Assess
      expect(result).toBe('testService');
    });

    it('returns an empty string if the environment variable is not set', () => {
      // Prepare
      vi.stubEnv('POWERTOOLS_SERVICE_NAME', undefined);

      // Act
      const result = getServiceName();

      // Assess
      expect(result).toBe('');
    });
  });

  describe('Function: getXrayTraceIdFromEnv', () => {
    it.each<{ description: string; traceData: string; expected: string }>([
      {
        description:
          'returns the value of the environment variable _X_AMZN_TRACE_ID',
        traceData: 'abcd123456789',
        expected: 'abcd123456789',
      },
      {
        description:
          'returns the value of the Root X-Ray segment ID properly formatted',
        traceData:
          'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1',
        expected: '1-5759e988-bd862e3fe1be46a994272793',
      },
    ])('$description', ({ traceData, expected }) => {
      // Prepare
      vi.stubEnv('_X_AMZN_TRACE_ID', traceData);

      // Act
      const value = getXRayTraceIdFromEnv();

      // Assess
      expect(value).toEqual(expected);
    });

    it.each<{ description: string; traceData: string; expected: string }>([
      {
        description: 'returns trace id from async context',
        traceData: 'xyz987654321',
        expected: 'xyz987654321',
      },
      {
        description:
          'returns the Root X-Ray segment ID properly formatted from async context',
        traceData:
          'Root=1-6849f099-ce973f4ea2c57e4f9a382904;Parent=668bfc7d9aa5b120;Sampled=0',
        expected: '1-6849f099-ce973f4ea2c57e4f9a382904',
      },
    ])('$description', async ({ traceData, expected }) => {
      const invokeStore = await InvokeStore.getInstanceAsync();
      invokeStore.run(
        {
          [InvokeStoreBase.PROTECTED_KEYS.X_RAY_TRACE_ID]: traceData,
        },
        () => {
          // Act
          const value = getXRayTraceIdFromEnv();

          // Assess
          expect(value).toEqual(expected);
        }
      );
    });
  });

  describe('Function: isRequestXRaySampled', () => {
    it.each<{
      description: string;
      traceData: string | undefined;
      expected: boolean;
    }>([
      {
        description:
          'returns true if the Sampled flag is set in the _X_AMZN_TRACE_ID environment variable',
        traceData:
          'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1',
        expected: true,
      },
      {
        description:
          'returns false if the Sampled flag is not set in the _X_AMZN_TRACE_ID environment variable',
        traceData:
          'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047',
        expected: false,
      },
      {
        description:
          'returns false when no _X_AMZN_TRACE_ID environment variable is present',
        traceData: undefined,
        expected: false,
      },
    ])('$description', ({ traceData, expected }) => {
      // Prepare
      vi.stubEnv('_X_AMZN_TRACE_ID', traceData);

      // Act
      const value = isRequestXRaySampled();

      // Assess
      expect(value).toEqual(expected);
    });

    it.each<{
      description: string;
      traceData: string | undefined;
      expected: boolean;
    }>([
      {
        description:
          'returns true if the Sampled flag is set from async context',
        traceData:
          'Root=1-7a5bc3d2-ef456789abcdef012345678;Parent=9f8e7d6c5b4a3210;Sampled=1',
        expected: true,
      },
      {
        description:
          'returns false if the Sampled flag is not set from async context',
        traceData:
          'Root=1-8b6cd4e3-fg567890bcdefg123456789;Parent=0g9f8e7d6c5b4321',
        expected: false,
      },
      {
        description:
          'returns false when no trace ID is present in async context',
        traceData: undefined,
        expected: false,
      },
    ])('$description', async ({ traceData, expected }) => {
      const invokeStore = await InvokeStore.getInstanceAsync();
      invokeStore.run(
        {
          [InvokeStoreBase.PROTECTED_KEYS.X_RAY_TRACE_ID]: traceData,
        },
        () => {
          // Act
          const value = isRequestXRaySampled();

          // Assess
          expect(value).toEqual(expected);
        }
      );
    });
  });

  describe('Function: shouldUseInvokeStore', () => {
    it('returns true when AWS_LAMBDA_MAX_CONCURRENCY is not set', () => {
      // Act
      const result = shouldUseInvokeStore();

      // Assess
      expect(result).toBe(false);
    });

    it('returns false when AWS_LAMBDA_MAX_CONCURRENCY is set', () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');

      // Act
      const result = shouldUseInvokeStore();

      // Assess
      expect(result).toBe(true);
    });
  });
});

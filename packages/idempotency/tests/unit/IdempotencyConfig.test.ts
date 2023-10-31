/**
 * Test IdempotencyConfig class
 *
 * @group unit/idempotency/config
 */
import context from '@aws-lambda-powertools/testing-utils/context';
import { IdempotencyConfig } from '../../src/index.js';
import type { IdempotencyConfigOptions } from '../../src/types/index.js';

describe('Class: IdempotencyConfig', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: configure', () => {
    test('when configured with an empty config object, it initializes the config with default values', () => {
      // Prepare
      const configOptions = {};

      // Act
      const config = new IdempotencyConfig(configOptions);

      // Assess
      expect(config).toEqual(
        expect.objectContaining({
          eventKeyJmesPath: '',
          payloadValidationJmesPath: undefined,
          throwOnNoIdempotencyKey: false,
          expiresAfterSeconds: 3600,
          useLocalCache: false,
          hashFunction: 'md5',
          lambdaContext: undefined,
        })
      );
    });

    test('when configured with a config object, it initializes the config with the provided configs', () => {
      // Prepare
      const configOptions: IdempotencyConfigOptions = {
        eventKeyJmesPath: 'eventKeyJmesPath',
        payloadValidationJmesPath: 'payloadValidationJmesPath',
        throwOnNoIdempotencyKey: true,
        expiresAfterSeconds: 100,
        useLocalCache: true,
        hashFunction: 'hashFunction',
        lambdaContext: context,
      };

      // Act
      const config = new IdempotencyConfig(configOptions);

      // Assess
      expect(config).toEqual(
        expect.objectContaining({
          eventKeyJmesPath: 'eventKeyJmesPath',
          payloadValidationJmesPath: 'payloadValidationJmesPath',
          throwOnNoIdempotencyKey: true,
          expiresAfterSeconds: 100,
          useLocalCache: true,
          hashFunction: 'hashFunction',
          lambdaContext: context,
        })
      );
    });
  });

  describe('Method: registerLambdaContext', () => {
    test('when called, it stores the provided context', async () => {
      // Prepare
      const config = new IdempotencyConfig({});

      // Act
      config.registerLambdaContext(context);

      // Assess
      expect(config).toEqual(
        expect.objectContaining({
          lambdaContext: context,
        })
      );
    });
  });
});

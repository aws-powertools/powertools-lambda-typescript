import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import {
  Functions,
  PowertoolsFunctions,
} from '@aws-lambda-powertools/jmespath/functions';
import context from '@aws-lambda-powertools/testing-utils/context';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { IdempotencyConfig } from '../../src/index.js';
import type { IdempotencyConfigOptions } from '../../src/types/index.js';

describe('Class: IdempotencyConfig', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: configure', () => {
    it('initializes the config with default values', () => {
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
          jmesPathOptions: expect.objectContaining({
            customFunctions: expect.any(PowertoolsFunctions),
          }),
        })
      );
    });

    it('initializes the config with the provided configs', () => {
      // Prepare
      class MyFancyFunctions extends Functions {
        @Functions.signature({
          argumentsSpecs: [['string']],
        })
        public funcMyFancyFunction(value: string): JSONValue {
          return JSON.parse(value);
        }
      }
      const configOptions: IdempotencyConfigOptions = {
        eventKeyJmesPath: 'eventKeyJmesPath',
        payloadValidationJmesPath: 'payloadValidationJmesPath',
        throwOnNoIdempotencyKey: true,
        expiresAfterSeconds: 100,
        useLocalCache: true,
        hashFunction: 'hashFunction',
        lambdaContext: context,
        jmesPathOptions: new MyFancyFunctions(),
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
          jmesPathOptions: expect.objectContaining({
            customFunctions: expect.any(MyFancyFunctions),
          }),
        })
      );
    });
  });

  describe('Method: registerLambdaContext', () => {
    it('stores the provided context', async () => {
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

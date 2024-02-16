/**
 * Test BasePersistenceLayer class
 *
 * @group unit/idempotency/persistence/base
 */
import { createHash } from 'node:crypto';
import { ContextExamples as dummyContext } from '@aws-lambda-powertools/commons';
import { IdempotencyConfig, IdempotencyRecordStatus } from '../../../src';
import {
  BasePersistenceLayer,
  IdempotencyRecord,
} from '../../../src/persistence';
import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyValidationError,
} from '../../../src/errors';
import type { IdempotencyConfigOptions } from '../../../src/types';

jest.mock('node:crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn(),
    digest: jest.fn().mockReturnValue('mocked-hash'),
  }),
}));

describe('Class: BasePersistenceLayer', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext.helloworldContext;

  class PersistenceLayerTestClass extends BasePersistenceLayer {
    public _deleteRecord = jest.fn();
    public _getRecord = jest.fn();
    public _putRecord = jest.fn();
    public _updateRecord = jest.fn();
  }

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
    jest.useRealTimers();
  });

  describe('Method: constructor', () => {
    test('when initialized with no arguments, it initializes with default values', () => {
      // Prepare & Act
      const persistenceLayer = new PersistenceLayerTestClass();

      // Assess
      expect(persistenceLayer.idempotencyKeyPrefix).toBe('my-lambda-function');
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          configured: false,
          expiresAfterSeconds: 3600,
          hashFunction: 'md5',
          payloadValidationEnabled: false,
          throwOnNoIdempotencyKey: false,
          useLocalCache: false,
        })
      );
    });
  });

  describe('Method: configure', () => {
    test('when configured with a function name, it appends the function name to the idempotency key prefix', () => {
      // Prepare
      const config = new IdempotencyConfig({});
      const persistenceLayer = new PersistenceLayerTestClass();

      // Act
      persistenceLayer.configure({ config, functionName: 'my-function' });

      // Assess
      expect(persistenceLayer.idempotencyKeyPrefix).toBe(
        'my-lambda-function.my-function'
      );
    });

    test('when configured with an empty config object, it initializes the persistence layer with default configs', () => {
      // Prepare
      const config = new IdempotencyConfig({});
      const persistenceLayer = new PersistenceLayerTestClass();

      // Act
      persistenceLayer.configure({ config });

      // Assess
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          configured: true,
          validationKeyJmesPath: undefined,
          payloadValidationEnabled: false,
          expiresAfterSeconds: 3600,
          throwOnNoIdempotencyKey: false,
          eventKeyJmesPath: '',
          useLocalCache: false,
          hashFunction: 'md5',
        })
      );
    });

    test('when configured with a config object, it initializes the persistence layer with the provided configs', () => {
      // Prepare
      const configOptions: IdempotencyConfigOptions = {
        eventKeyJmesPath: 'eventKeyJmesPath',
        payloadValidationJmesPath: 'payloadValidationJmesPath',
        throwOnNoIdempotencyKey: true,
        expiresAfterSeconds: 100,
        useLocalCache: true,
        maxLocalCacheSize: 300,
        hashFunction: 'hashFunction',
        lambdaContext: context,
      };
      const config = new IdempotencyConfig(configOptions);
      const persistenceLayer = new PersistenceLayerTestClass();

      // Act
      persistenceLayer.configure({ config });

      // Assess
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          configured: true,
          eventKeyJmesPath: 'eventKeyJmesPath',
          validationKeyJmesPath: 'payloadValidationJmesPath',
          payloadValidationEnabled: true,
          throwOnNoIdempotencyKey: true,
          expiresAfterSeconds: 100,
          useLocalCache: true,
          hashFunction: 'hashFunction',
        })
      );
    });

    test('when called twice, it returns without reconfiguring the persistence layer', () => {
      // Prepare
      const config = new IdempotencyConfig({
        eventKeyJmesPath: 'eventKeyJmesPath',
      });
      const secondConfig = new IdempotencyConfig({
        eventKeyJmesPath: 'secondEventKeyJmesPath',
      });
      const persistenceLayer = new PersistenceLayerTestClass();

      // Act
      persistenceLayer.configure({ config });
      persistenceLayer.configure({ config: secondConfig });

      // Assess
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          configured: true,
          eventKeyJmesPath: 'eventKeyJmesPath',
        })
      );
    });
  });

  describe('Method: deleteRecord', () => {
    test('when called, it calls the _deleteRecord method with the correct arguments', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      const baseIdempotencyRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        status: IdempotencyRecordStatus.EXPIRED,
      });
      const deleteRecordSpy = jest.spyOn(persistenceLayer, '_deleteRecord');

      // Act
      await persistenceLayer.deleteRecord({ foo: 'bar' });

      // Assess
      expect(deleteRecordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ...baseIdempotencyRecord,
          idempotencyKey: 'my-lambda-function#mocked-hash',
          status: IdempotencyRecordStatus.EXPIRED,
        })
      );
    });

    test('when called, it deletes the record from the local cache', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          useLocalCache: true,
        }),
      });
      const baseIdempotencyRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        status: IdempotencyRecordStatus.EXPIRED,
      });
      await persistenceLayer.saveSuccess({ foo: 'bar' }, { bar: 'baz' });
      const deleteRecordSpy = jest.spyOn(persistenceLayer, '_deleteRecord');

      // Act
      await persistenceLayer.deleteRecord({ foo: 'bar' });

      // Assess
      expect(deleteRecordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ...baseIdempotencyRecord,
          idempotencyKey: 'my-lambda-function#mocked-hash',
          status: IdempotencyRecordStatus.EXPIRED,
        })
      );
    });
  });

  describe('Method: getRecord', () => {
    test('when called, it calls the _getRecord method with the correct arguments', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          eventKeyJmesPath: 'foo',
        }),
      });
      const getRecordSpy = jest.spyOn(persistenceLayer, '_getRecord');

      // Act
      await persistenceLayer.getRecord({ foo: 'bar' });

      // Assess
      expect(getRecordSpy).toHaveBeenCalledWith(
        'my-lambda-function#mocked-hash'
      );
    });

    test('when called and payload validation fails due to hash mismatch, it throws an IdempotencyValidationError', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          payloadValidationJmesPath: 'foo',
        }),
      });
      const existingRecord = new IdempotencyRecord({
        idempotencyKey: 'my-lambda-function#mocked-hash',
        status: IdempotencyRecordStatus.INPROGRESS,
        payloadHash: 'different-hash',
      });
      jest
        .spyOn(persistenceLayer, '_getRecord')
        .mockReturnValue(existingRecord);

      // Act & Assess
      await expect(persistenceLayer.getRecord({ foo: 'bar' })).rejects.toThrow(
        new IdempotencyValidationError(
          'Payload does not match stored record for this event key',
          existingRecord
        )
      );
    });

    test('when called and the hash generation fails, and throwOnNoIdempotencyKey is disabled, it logs a warning', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          // This will cause the hash generation to fail because the event does not have a bar property
          eventKeyJmesPath: 'bar',
        }),
      });
      const logWarningSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await persistenceLayer.getRecord({ foo: 'bar' });

      // Assess
      expect(logWarningSpy).toHaveBeenCalledWith(
        'No value found for idempotency_key. jmespath: bar'
      );
    });

    test('when called and the hash generation fails, and throwOnNoIdempotencyKey is enabled, it throws', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          throwOnNoIdempotencyKey: true,
          // This will cause the hash generation to fail because the JMESPath expression will return an empty array
          eventKeyJmesPath: 'foo.bar',
        }),
      });

      // Act & Assess
      await expect(
        persistenceLayer.getRecord({ foo: { bar: [] } })
      ).rejects.toThrow(
        new Error('No data found to create a hashed idempotency_key')
      );
    });

    test('when called twice with the same payload, it retrieves the record from the local cache', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          useLocalCache: true,
        }),
      });
      const getRecordSpy = jest
        .spyOn(persistenceLayer, '_getRecord')
        .mockReturnValue(
          new IdempotencyRecord({
            idempotencyKey: 'my-lambda-function#mocked-hash',
            status: IdempotencyRecordStatus.COMPLETED,
            payloadHash: 'different-hash',
          })
        );

      // Act
      await persistenceLayer.getRecord({ foo: 'bar' });
      await persistenceLayer.getRecord({ foo: 'bar' });

      // Assess
      expect(getRecordSpy).toHaveBeenCalledTimes(1);
    });

    test('when called twice with the same payload, if it founds an expired record in the local cache, it retrieves it', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          useLocalCache: true,
        }),
      });
      const getRecordSpy = jest
        .spyOn(persistenceLayer, '_getRecord')
        .mockReturnValue(
          new IdempotencyRecord({
            idempotencyKey: 'my-lambda-function#mocked-hash',
            status: IdempotencyRecordStatus.EXPIRED,
            payloadHash: 'different-hash',
            expiryTimestamp: Date.now() / 1000 - 1,
          })
        );

      // Act
      await persistenceLayer.getRecord({ foo: 'bar' });
      await persistenceLayer.getRecord({ foo: 'bar' });

      // Assess
      expect(getRecordSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Method: saveInProgress', () => {
    test('when called, it calls the _putRecord method with the correct arguments', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      const putRecordSpy = jest.spyOn(persistenceLayer, '_putRecord');
      const remainingTimeInMs = 2000;

      // Act
      await persistenceLayer.saveInProgress({ foo: 'bar' }, remainingTimeInMs);

      // Assess
      expect(putRecordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'my-lambda-function#mocked-hash',
          status: IdempotencyRecordStatus.INPROGRESS,
          expiryTimestamp: Date.now() / 1000 + 3600,
          payloadHash: '',
          inProgressExpiryTimestamp: Date.now() + remainingTimeInMs,
          responseData: undefined,
        })
      );
    });

    test('when called without remainingTimeInMillis, it logs a warning and then calls the _putRecord method', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      const putRecordSpy = jest.spyOn(persistenceLayer, '_putRecord');
      const logWarningSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => ({}));

      // Act
      await persistenceLayer.saveInProgress({ foo: 'bar' });

      // Assess
      expect(putRecordSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenCalledWith(
        'Could not determine remaining time left. Did you call registerLambdaContext on IdempotencyConfig?'
      );
    });

    test('when called and there is already a completed record in the cache, it throws an IdempotencyItemAlreadyExistsError', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          useLocalCache: true,
        }),
      });
      const putRecordSpy = jest.spyOn(persistenceLayer, '_putRecord');
      await persistenceLayer.saveSuccess({ foo: 'bar' }, { bar: 'baz' });

      // Act & Assess
      await expect(
        persistenceLayer.saveInProgress({ foo: 'bar' })
      ).rejects.toThrow(IdempotencyItemAlreadyExistsError);
      expect(putRecordSpy).toHaveBeenCalledTimes(0);
    });

    test('when called and there is an in-progress record in the cache, it returns', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          useLocalCache: true,
        }),
      });
      jest.spyOn(persistenceLayer, '_getRecord').mockImplementationOnce(
        () =>
          new IdempotencyRecord({
            idempotencyKey: 'my-lambda-function#mocked-hash',
            status: IdempotencyRecordStatus.INPROGRESS,
            payloadHash: 'different-hash',
            expiryTimestamp: Date.now() / 1000 + 3600,
            inProgressExpiryTimestamp: Date.now() + 2000,
          })
      );
      await persistenceLayer.getRecord({ foo: 'bar' });

      // Act & Assess
      await expect(
        persistenceLayer.saveInProgress({ foo: 'bar' })
      ).resolves.toBeUndefined();
    });
  });

  describe('Method: saveSuccess', () => {
    test('when called, it calls the _updateRecord method with the correct arguments', async () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      const updateRecordSpy = jest.spyOn(persistenceLayer, '_updateRecord');
      const result = { bar: 'baz' };

      // Act
      await persistenceLayer.saveSuccess({ foo: 'bar' }, result);

      // Assess
      expect(updateRecordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'my-lambda-function#mocked-hash',
          status: IdempotencyRecordStatus.COMPLETED,
          expiryTimestamp: Date.now() / 1000 + 3600,
          payloadHash: '',
          inProgressExpiryTimestamp: undefined,
          responseData: result,
        })
      );
    });
  });

  describe('Method: validatePayload', () => {
    it('throws an error if the payload does not match the stored record', () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          payloadValidationJmesPath: 'foo',
        }),
      });
      const existingRecord = new IdempotencyRecord({
        idempotencyKey: 'my-lambda-function#mocked-hash',
        status: IdempotencyRecordStatus.INPROGRESS,
        payloadHash: 'different-hash',
      });

      // Act & Assess
      expect(() =>
        persistenceLayer.validatePayload({ foo: 'bar' }, existingRecord)
      ).toThrow(
        new IdempotencyValidationError(
          'Payload does not match stored record for this event key',
          existingRecord
        )
      );
    });

    it('returns if the payload matches the stored record', () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          payloadValidationJmesPath: 'foo',
        }),
      });
      const existingRecord = new IdempotencyRecord({
        idempotencyKey: 'my-lambda-function#mocked-hash',
        status: IdempotencyRecordStatus.INPROGRESS,
        payloadHash: 'mocked-hash',
      });

      // Act & Assess
      expect(() =>
        persistenceLayer.validatePayload({ foo: 'bar' }, existingRecord)
      ).not.toThrow();
    });

    it('skips validation if payload validation is not enabled', () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      const existingRecord = new IdempotencyRecord({
        idempotencyKey: 'my-lambda-function#mocked-hash',
        status: IdempotencyRecordStatus.INPROGRESS,
        payloadHash: 'different-hash',
      });

      // Act & Assess
      expect(() =>
        persistenceLayer.validatePayload({ foo: 'bar' }, existingRecord)
      ).not.toThrow();
    });

    it('skips hashing if the payload is already an IdempotencyRecord', () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({
        config: new IdempotencyConfig({
          payloadValidationJmesPath: 'foo',
        }),
      });
      const existingRecord = new IdempotencyRecord({
        idempotencyKey: 'my-lambda-function#mocked-hash',
        status: IdempotencyRecordStatus.INPROGRESS,
        payloadHash: 'mocked-hash',
      });
      const payload = new IdempotencyRecord({
        idempotencyKey: 'my-lambda-function#mocked-hash',
        status: IdempotencyRecordStatus.INPROGRESS,
        payloadHash: 'mocked-hash',
      });

      // Act
      persistenceLayer.validatePayload(payload, existingRecord);
      expect(createHash).toHaveBeenCalledTimes(0);
    });
  });

  describe('Method: getExpiresAfterSeconds', () => {
    it('returns the configured value', () => {
      // Prepare
      const persistenceLayer = new PersistenceLayerTestClass();

      // Act
      const result = persistenceLayer.getExpiresAfterSeconds();

      // Assess
      expect(result).toBe(3600);
    });
  });
});

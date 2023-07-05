/**
 * Test Idempotency Handler
 *
 * @group unit/idempotency/IdempotencyHandler
 */
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from '../../src/errors';
import { IdempotencyRecordStatus } from '../../src/types';
import { IdempotencyRecord } from '../../src/persistence';
import { IdempotencyHandler } from '../../src/IdempotencyHandler';
import { IdempotencyConfig } from '../../src/';
import { MAX_RETRIES } from '../../src/constants';
import { PersistenceLayerTestClass } from '../helpers/idempotencyUtils';
import { Context } from 'aws-lambda';

const mockFunctionToMakeIdempotent = jest.fn();
const mockFunctionPayloadToBeHashed = {};
const mockIdempotencyOptions = {
  persistenceStore: new PersistenceLayerTestClass(),
  dataKeywordArgument: 'testKeywordArgument',
  config: new IdempotencyConfig({}),
};

const idempotentHandler = new IdempotencyHandler({
  functionToMakeIdempotent: mockFunctionToMakeIdempotent,
  functionPayloadToBeHashed: mockFunctionPayloadToBeHashed,
  persistenceStore: mockIdempotencyOptions.persistenceStore,
  functionArguments: [],
  idempotencyConfig: mockIdempotencyOptions.config,
});

describe('Class IdempotencyHandler', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
    jest.spyOn(console, 'debug').mockImplementation(() => null);
    jest.spyOn(console, 'warn').mockImplementation(() => null);
    jest.spyOn(console, 'error').mockImplementation(() => null);
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: determineResultFromIdempotencyRecord', () => {
    test('when record is in progress and within expiry window, it rejects with IdempotencyAlreadyInProgressError', async () => {
      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: Date.now() + 1000, // should be in the future
        inProgressExpiryTimestamp: 0, // less than current time in milliseconds
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.INPROGRESS,
      });

      expect(stubRecord.isExpired()).toBe(false);
      expect(stubRecord.getStatus()).toBe(IdempotencyRecordStatus.INPROGRESS);

      try {
        await IdempotencyHandler.determineResultFromIdempotencyRecord(
          stubRecord
        );
      } catch (e) {
        expect(e).toBeInstanceOf(IdempotencyAlreadyInProgressError);
      }
    });

    test('when record is in progress and outside expiry window, it rejects with IdempotencyInconsistentStateError', async () => {
      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: Date.now() + 1000, // should be in the future
        inProgressExpiryTimestamp: new Date().getUTCMilliseconds() - 1000, // should be in the past
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.INPROGRESS,
      });

      expect(stubRecord.isExpired()).toBe(false);
      expect(stubRecord.getStatus()).toBe(IdempotencyRecordStatus.INPROGRESS);

      try {
        await IdempotencyHandler.determineResultFromIdempotencyRecord(
          stubRecord
        );
      } catch (e) {
        expect(e).toBeInstanceOf(IdempotencyInconsistentStateError);
      }
    });

    test('when record is expired, it rejects with IdempotencyInconsistentStateError', async () => {
      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: new Date().getUTCMilliseconds() - 1000, // should be in the past
        inProgressExpiryTimestamp: 0, // less than current time in milliseconds
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.EXPIRED,
      });

      expect(stubRecord.isExpired()).toBe(true);
      expect(stubRecord.getStatus()).toBe(IdempotencyRecordStatus.EXPIRED);

      try {
        await IdempotencyHandler.determineResultFromIdempotencyRecord(
          stubRecord
        );
      } catch (e) {
        expect(e).toBeInstanceOf(IdempotencyInconsistentStateError);
      }
    });
  });

  describe('Method: handle', () => {
    afterAll(() => jest.restoreAllMocks()); // restore processIdempotency for other tests

    test('when IdempotencyAlreadyInProgressError is thrown, it retries once', async () => {
      const mockProcessIdempotency = jest
        .spyOn(IdempotencyHandler.prototype, 'processIdempotency')
        .mockRejectedValue(
          new IdempotencyAlreadyInProgressError(
            'There is already an execution in progress'
          )
        );
      await expect(idempotentHandler.handle()).rejects.toThrow(
        IdempotencyAlreadyInProgressError
      );
      expect(mockProcessIdempotency).toHaveBeenCalledTimes(1);
    });

    test('when IdempotencyInconsistentStateError is thrown, it retries until max retries are exhausted', async () => {
      const mockProcessIdempotency = jest
        .spyOn(IdempotencyHandler.prototype, 'processIdempotency')
        .mockRejectedValue(new IdempotencyInconsistentStateError());
      await expect(idempotentHandler.handle()).rejects.toThrow(
        IdempotencyInconsistentStateError
      );
      expect(mockProcessIdempotency).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });

    test('when non IdempotencyAlreadyInProgressError is thrown, it rejects', async () => {
      const mockProcessIdempotency = jest
        .spyOn(IdempotencyHandler.prototype, 'processIdempotency')
        .mockRejectedValue(new Error('Some other error'));

      await expect(idempotentHandler.handle()).rejects.toThrow(Error);
      expect(mockProcessIdempotency).toHaveBeenCalledTimes(1);
    });
  });

  describe('Method: processIdempotency', () => {
    test('when persistenceStore saves successfuly, it resolves', async () => {
      const mockSaveInProgress = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
        .mockResolvedValue();

      mockFunctionToMakeIdempotent.mockImplementation(() =>
        Promise.resolve('result')
      );

      await expect(idempotentHandler.processIdempotency()).resolves.toBe(
        'result'
      );
      expect(mockSaveInProgress).toHaveBeenCalledTimes(1);
    });

    test('when persistences store throws any error, it wraps the error to IdempotencyPersistencesLayerError', async () => {
      const innerError = new Error('Some error');
      const mockSaveInProgress = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
        .mockRejectedValue(innerError);
      const mockDetermineResultFromIdempotencyRecord = jest
        .spyOn(IdempotencyHandler, 'determineResultFromIdempotencyRecord')
        .mockImplementation(() => 'result');
      await expect(idempotentHandler.processIdempotency()).rejects.toThrow(
        new IdempotencyPersistenceLayerError(
          'Failed to save in progress record to idempotency store',
          innerError
        )
      );

      expect(mockSaveInProgress).toHaveBeenCalledTimes(1);
      expect(mockDetermineResultFromIdempotencyRecord).toHaveBeenCalledTimes(0);
    });

    test('when idempotency item already exists, it returns the existing record', async () => {
      const mockSaveInProgress = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
        .mockRejectedValue(
          new IdempotencyItemAlreadyExistsError(
            'There is already an execution in progress'
          )
        );

      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: 0,
        inProgressExpiryTimestamp: 0,
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.INPROGRESS,
      });
      const mockGetRecord = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'getRecord')
        .mockImplementation(() => Promise.resolve(stubRecord));
      const mockDetermineResultFromIdempotencyRecord = jest
        .spyOn(IdempotencyHandler, 'determineResultFromIdempotencyRecord')
        .mockImplementation(() => 'result');

      await expect(idempotentHandler.processIdempotency()).resolves.toBe(
        'result'
      );
      expect(mockSaveInProgress).toHaveBeenCalledTimes(1);
      expect(mockGetRecord).toHaveBeenCalledTimes(1);
      expect(mockDetermineResultFromIdempotencyRecord).toHaveBeenCalledTimes(1);
    });

    test('when throwOnNoIdempotencyKey is false and the key is missing, we skip idempotency', async () => {
      const idempotentHandlerSkips = new IdempotencyHandler({
        functionToMakeIdempotent: mockFunctionToMakeIdempotent,
        functionPayloadToBeHashed: mockFunctionPayloadToBeHashed,
        persistenceStore: mockIdempotencyOptions.persistenceStore,
        functionArguments: [],
        idempotencyConfig: new IdempotencyConfig({
          throwOnNoIdempotencyKey: false,
          eventKeyJmesPath: 'idempotencyKey',
        }),
      });

      const mockSaveInProgress = jest.spyOn(
        mockIdempotencyOptions.persistenceStore,
        'saveInProgress'
      );

      const mockSaveSuccessfulResult = jest.spyOn(
        mockIdempotencyOptions.persistenceStore,
        'saveSuccess'
      );
      const mockGetRecord = jest.spyOn(
        mockIdempotencyOptions.persistenceStore,
        'getRecord'
      );

      mockFunctionToMakeIdempotent.mockImplementation(() => {
        return 'result';
      });

      await expect(idempotentHandlerSkips.processIdempotency()).resolves.toBe(
        'result'
      );
      expect(mockSaveInProgress).toHaveBeenCalledTimes(0);
      expect(mockGetRecord).toHaveBeenCalledTimes(0);
      expect(mockSaveSuccessfulResult).toHaveBeenCalledTimes(0);
    });

    test('when lambdaContext is registered, we pass it to saveInProgress', async () => {
      const mockSaveInProgress = jest.spyOn(
        mockIdempotencyOptions.persistenceStore,
        'saveInProgress'
      );

      const mockLambaContext: Context = {
        getRemainingTimeInMillis(): number {
          return 1000; // we expect this number to be passed to saveInProgress
        },
      } as Context;
      const idempotencyHandlerWithContext = new IdempotencyHandler({
        functionToMakeIdempotent: mockFunctionToMakeIdempotent,
        functionPayloadToBeHashed: mockFunctionPayloadToBeHashed,
        persistenceStore: mockIdempotencyOptions.persistenceStore,
        functionArguments: [],
        idempotencyConfig: new IdempotencyConfig({
          lambdaContext: mockLambaContext,
        }),
      });

      mockFunctionToMakeIdempotent.mockImplementation(() =>
        Promise.resolve('result')
      );

      await expect(idempotencyHandlerWithContext.processIdempotency()).resolves;

      expect(mockSaveInProgress).toBeCalledWith(
        mockFunctionPayloadToBeHashed,
        mockLambaContext.getRemainingTimeInMillis()
      );
    });
  });

  describe('Method: getFunctionResult', () => {
    test('when function returns a result, it saves the successful result and returns it', async () => {
      const mockSaveSuccessfulResult = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveSuccess')
        .mockResolvedValue();
      mockFunctionToMakeIdempotent.mockImplementation(() =>
        Promise.resolve('result')
      );

      await expect(idempotentHandler.getFunctionResult()).resolves.toBe(
        'result'
      );
      expect(mockSaveSuccessfulResult).toHaveBeenCalledTimes(1);
    });

    test('when function throws an error, it deletes the in progress record and throws the error', async () => {
      mockFunctionToMakeIdempotent.mockImplementation(() =>
        Promise.reject(new Error('Some error'))
      );

      const mockDeleteInProgress = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
        .mockResolvedValue();

      await expect(idempotentHandler.getFunctionResult()).rejects.toThrow(
        Error
      );
      expect(mockDeleteInProgress).toHaveBeenCalledTimes(1);
    });

    test('when deleteRecord throws an error, it wraps the error to IdempotencyPersistenceLayerError', async () => {
      mockFunctionToMakeIdempotent.mockImplementation(() =>
        Promise.reject(new Error('Some error'))
      );

      const mockDeleteInProgress = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
        .mockRejectedValue(new Error('Some error'));

      await expect(idempotentHandler.getFunctionResult()).rejects.toThrow(
        new IdempotencyPersistenceLayerError(
          'Failed to delete record from idempotency store',
          new Error('Some error')
        )
      );
      expect(mockDeleteInProgress).toHaveBeenCalledTimes(1);
    });

    test('when saveSuccessfulResult throws an error, it wraps the error to IdempotencyPersistenceLayerError', async () => {
      mockFunctionToMakeIdempotent.mockImplementation(() =>
        Promise.resolve('result')
      );

      const mockSaveSuccessfulResult = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveSuccess')
        .mockRejectedValue(new Error('Some error'));

      await expect(idempotentHandler.getFunctionResult()).rejects.toThrow(
        IdempotencyPersistenceLayerError
      );
      expect(mockSaveSuccessfulResult).toHaveBeenCalledTimes(1);
    });
  });
});

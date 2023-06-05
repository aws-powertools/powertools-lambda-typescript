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
} from '../../src/Exceptions';
import { IdempotencyRecordStatus } from '../../src/types';
import { BasePersistenceLayer, IdempotencyRecord } from '../../src/persistence';
import { IdempotencyHandler } from '../../src/IdempotencyHandler';
import { IdempotencyConfig } from '../../src/IdempotencyConfig';
import { MAX_RETRIES } from '../../src/constants';

class PersistenceLayerTestClass extends BasePersistenceLayer {
  protected _deleteRecord = jest.fn();
  protected _getRecord = jest.fn();
  protected _putRecord = jest.fn();
  protected _updateRecord = jest.fn();
}

const mockFunctionToMakeIdempotent = jest.fn();
const mockFunctionPayloadToBeHashed = {};
const mockIdempotencyOptions = {
  persistenceStore: new PersistenceLayerTestClass(),
  dataKeywordArgument: 'testKeywordArgument',
  config: new IdempotencyConfig({}),
};
const mockFullFunctionPayload = {};

const idempotentHandler = new IdempotencyHandler({
  functionToMakeIdempotent: mockFunctionToMakeIdempotent,
  functionPayloadToBeHashed: mockFunctionPayloadToBeHashed,
  persistenceStore: mockIdempotencyOptions.persistenceStore,
  fullFunctionPayload: mockFullFunctionPayload,
  idempotencyConfig: mockIdempotencyOptions.config,
});

describe('Class IdempotencyHandler', () => {
  beforeEach(() => jest.resetAllMocks());

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
      const mockSaveInProgress = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
        .mockRejectedValue(new Error('Some error'));
      const mockDetermineResultFromIdempotencyRecord = jest
        .spyOn(IdempotencyHandler, 'determineResultFromIdempotencyRecord')
        .mockImplementation(() => 'result');

      await expect(idempotentHandler.processIdempotency()).rejects.toThrow(
        IdempotencyPersistenceLayerError
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
        IdempotencyPersistenceLayerError
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

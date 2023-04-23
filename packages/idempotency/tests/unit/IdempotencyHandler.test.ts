/**
 * Test Idempotency Handler
 *
 * @group unit/idempotency/IdempotencyHandler
 */

import {
  IdempotencyAlreadyInProgressError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError
} from '../../src/Exceptions';
import { IdempotencyOptions, IdempotencyRecordStatus } from '../../src/types';
import { BasePersistenceLayer, IdempotencyRecord } from '../../src/persistence';
import { IdempotencyHandler } from '../../src/IdempotencyHandler';

class PersistenceLayerTestClass extends BasePersistenceLayer {
  protected _deleteRecord = jest.fn();
  protected _getRecord = jest.fn();
  protected _putRecord = jest.fn();
  protected _updateRecord = jest.fn();
}

const mockFunctionToMakeIdempotent = jest.fn();
const mockFunctionPayloadToBeHashed = {};
const mockIdempotencyOptions: IdempotencyOptions = {
  persistenceStore: new PersistenceLayerTestClass(),
  dataKeywordArgument: 'testingKey'
};
const mockFullFunctionPayload = {};

const idempotentHandler = new IdempotencyHandler(
  mockFunctionToMakeIdempotent,
  mockFunctionPayloadToBeHashed,
  mockIdempotencyOptions,
  mockFullFunctionPayload,
);

describe('Class IdempotencyHandler', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('Method: determineResultFromIdempotencyRecord', () => {
    test('when record is in progress and within expiry window, it rejects with IdempotencyAlreadyInProgressError', async () => {

      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: Date.now() + 10000, // should be in the future
        inProgressExpiryTimestamp: 0, // less than current time in milliseconds
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.INPROGRESS
      });

      expect(stubRecord.isExpired()).toBe(false);
      expect(stubRecord.getStatus()).toBe(IdempotencyRecordStatus.INPROGRESS);

      try {
        await idempotentHandler.determineResultFromIdempotencyRecord(stubRecord);
      } catch (e) {
        expect(e).toBeInstanceOf(IdempotencyAlreadyInProgressError);
      }
    });
  });

  describe('Method: handle', () => {

    afterAll(() => jest.restoreAllMocks()); // restore processIdempotency for other tests

    test('when IdempotencyAlreadyInProgressError is thrown, it retries two times', async () => {
      const mockProcessIdempotency = jest.spyOn(IdempotencyHandler.prototype, 'processIdempotency').mockRejectedValue(new IdempotencyAlreadyInProgressError('There is already an execution in progress'));
      await expect(
        idempotentHandler.handle()
      ).rejects.toThrow(IdempotencyAlreadyInProgressError);
      expect(mockProcessIdempotency).toHaveBeenCalledTimes(2);
    });

    test('when non IdempotencyAlreadyInProgressError is thrown, it rejects', async () => {

      const mockProcessIdempotency = jest.spyOn(IdempotencyHandler.prototype, 'processIdempotency').mockRejectedValue(new Error('Some other error'));

      await expect(
        idempotentHandler.handle()
      ).rejects.toThrow(Error);
      expect(mockProcessIdempotency).toHaveBeenCalledTimes(1);
    });

  });

  describe('Method: processIdempotency', () => {

    test('when persistenceStore saves successfuly, it resolves', async () => {
      const mockSaveInProgress = jest.spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress').mockResolvedValue();

      mockFunctionToMakeIdempotent.mockImplementation(() => Promise.resolve('result'));

      await expect(
        idempotentHandler.processIdempotency()
      ).resolves.toBe('result');
      expect(mockSaveInProgress).toHaveBeenCalledTimes(1);
    });

    test('when persistences store throws any error, it wraps the error to IdempotencyPersistencesLayerError', async () => {
      const mockSaveInProgress = jest.spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress').mockRejectedValue(new Error('Some error'));
      const mockDetermineResultFromIdempotencyRecord = jest.spyOn(IdempotencyHandler.prototype, 'determineResultFromIdempotencyRecord').mockResolvedValue('result');

      await expect(
        idempotentHandler.processIdempotency()
      ).rejects.toThrow(IdempotencyPersistenceLayerError);
      expect(mockSaveInProgress).toHaveBeenCalledTimes(1);
      expect(mockDetermineResultFromIdempotencyRecord).toHaveBeenCalledTimes(0);
    });

    test('when idempotency item already exists, it returns the existing record', async () => {
      const mockSaveInProgress = jest.spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress').mockRejectedValue(new IdempotencyItemAlreadyExistsError('There is already an execution in progress'));

      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: 0,
        inProgressExpiryTimestamp: 0,
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.INPROGRESS
      });
      const mockGetRecord = jest.spyOn(mockIdempotencyOptions.persistenceStore, 'getRecord').mockImplementation(() => Promise.resolve(stubRecord));
      const mockDetermineResultFromIdempotencyRecord = jest.spyOn(IdempotencyHandler.prototype, 'determineResultFromIdempotencyRecord').mockResolvedValue('result');

      await expect(
        idempotentHandler.processIdempotency()
      ).resolves.toBe('result');
      expect(mockSaveInProgress).toHaveBeenCalledTimes(1);
      expect(mockGetRecord).toHaveBeenCalledTimes(1);
      expect(mockDetermineResultFromIdempotencyRecord).toHaveBeenCalledTimes(1);
    });
  });

});


import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IdempotencyHandler } from '../../src/IdempotencyHandler.js';
import { IdempotencyRecordStatus, MAX_RETRIES } from '../../src/constants.js';
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyConfig,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from '../../src/index.js';
import { IdempotencyRecord } from '../../src/persistence/index.js';
import { PersistenceLayerTestClass } from '../helpers/idempotencyUtils.js';

const mockFunctionToMakeIdempotent = vi.fn();
const mockResponseHook = vi
  .fn()
  .mockImplementation((response, record) => response);
const mockFunctionPayloadToBeHashed = {};
const persistenceStore = new PersistenceLayerTestClass();
const mockIdempotencyOptions = {
  persistenceStore,
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
    vi.clearAllMocks();
    vi.restoreAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
    vi.spyOn(console, 'debug').mockImplementation(() => null);
    vi.spyOn(console, 'warn').mockImplementation(() => null);
    vi.spyOn(console, 'error').mockImplementation(() => null);
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: determineResultFromIdempotencyRecord', () => {
    it('throws when the record is in progress and within expiry window', async () => {
      // Prepare
      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: Date.now() + 1000, // should be in the future
        inProgressExpiryTimestamp: 0, // less than current time in milliseconds
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.INPROGRESS,
      });

      // Act & Assess
      expect(stubRecord.isExpired()).toBe(false);
      expect(stubRecord.getStatus()).toBe(IdempotencyRecordStatus.INPROGRESS);
      expect(() =>
        idempotentHandler.determineResultFromIdempotencyRecord(stubRecord)
      ).toThrow(IdempotencyAlreadyInProgressError);
      expect(mockResponseHook).not.toHaveBeenCalled();
    });

    it('throws when the record is in progress and outside expiry window', async () => {
      // Prepare
      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: Date.now() + 1000, // should be in the future
        inProgressExpiryTimestamp: new Date().getUTCMilliseconds() - 1000, // should be in the past
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.INPROGRESS,
      });

      // Act & Assess
      expect(stubRecord.isExpired()).toBe(false);
      expect(stubRecord.getStatus()).toBe(IdempotencyRecordStatus.INPROGRESS);
      expect(() =>
        idempotentHandler.determineResultFromIdempotencyRecord(stubRecord)
      ).toThrow(IdempotencyInconsistentStateError);
      expect(mockResponseHook).not.toHaveBeenCalled();
    });

    it('throws when the idempotency record is expired', async () => {
      // Prepare
      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: new Date().getUTCMilliseconds() - 1000, // should be in the past
        inProgressExpiryTimestamp: 0, // less than current time in milliseconds
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.EXPIRED,
      });

      // Act & Assess
      expect(stubRecord.isExpired()).toBe(true);
      expect(stubRecord.getStatus()).toBe(IdempotencyRecordStatus.EXPIRED);
      expect(() =>
        idempotentHandler.determineResultFromIdempotencyRecord(stubRecord)
      ).toThrow(IdempotencyInconsistentStateError);
      expect(mockResponseHook).not.toHaveBeenCalled();
    });

    it('calls the provided response hook', () => {
      // Prepare
      interface HandlerResponse {
        message: string;
        statusCode: number;
        headers?: Record<string, string>;
      }

      const responseHook = vi
        .fn()
        .mockImplementation(
          (response: JSONValue, record: IdempotencyRecord) => {
            const handlerResponse = response as unknown as HandlerResponse;
            handlerResponse.headers = {
              'x-idempotency-key': record.idempotencyKey,
            };
            return handlerResponse as unknown as JSONValue;
          }
        );

      const idempotentHandler = new IdempotencyHandler({
        functionToMakeIdempotent: mockFunctionToMakeIdempotent,
        functionPayloadToBeHashed: mockFunctionPayloadToBeHashed,
        persistenceStore: mockIdempotencyOptions.persistenceStore,
        functionArguments: [],
        idempotencyConfig: new IdempotencyConfig({
          responseHook,
        }),
      });

      const responseData = {
        message: 'Original message',
        statusCode: 200,
      };

      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'test-key',
        responseData,
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.COMPLETED,
      });

      // Act
      const result =
        idempotentHandler.determineResultFromIdempotencyRecord(stubRecord);

      // Assess
      expect(responseHook).toHaveBeenCalledWith(responseData, stubRecord);
      expect(result).toEqual({
        message: 'Original message',
        statusCode: 200,
        headers: {
          'x-idempotency-key': 'test-key',
        },
      });
    });
  });

  describe('Method: handle', () => {
    it('retries once when IdempotencyAlreadyInProgressError is thrown', async () => {
      // Prepare
      const saveInProgressSpy = vi
        .spyOn(persistenceStore, 'saveInProgress')
        .mockRejectedValueOnce(new IdempotencyItemAlreadyExistsError());

      // Act & Assess
      await expect(idempotentHandler.handle()).rejects.toThrow();
      expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
    });

    it('returns the existing record when IdempotencyAlreadyInProgressError is thrown', async () => {
      // Prepare
      const saveInProgressSpy = vi
        .spyOn(persistenceStore, 'saveInProgress')
        .mockRejectedValueOnce(
          new IdempotencyItemAlreadyExistsError(
            'Failed to put record for already existing idempotency key: idempotence-key',
            new IdempotencyRecord({
              idempotencyKey: 'key',
              status: IdempotencyRecordStatus.COMPLETED,
              responseData: 'Hi',
            })
          )
        );
      const getRecordSpy = vi.spyOn(persistenceStore, 'getRecord');

      // Act & Assess
      await expect(idempotentHandler.handle()).resolves.toEqual('Hi');
      expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
      expect(getRecordSpy).toHaveBeenCalledTimes(0);
    });

    it('retries until max retries are exhausted when IdempotencyInconsistentStateError is thrown', async () => {
      // Prepare
      const mockProcessIdempotency = vi
        .spyOn(persistenceStore, 'saveInProgress')
        .mockRejectedValue(new IdempotencyItemAlreadyExistsError());
      vi.spyOn(persistenceStore, 'getRecord').mockResolvedValue(
        new IdempotencyRecord({
          status: IdempotencyRecordStatus.EXPIRED,
          idempotencyKey: 'idempotencyKey',
        })
      );

      // Act & Assess
      await expect(idempotentHandler.handle()).rejects.toThrow(
        IdempotencyInconsistentStateError
      );
      expect(mockProcessIdempotency).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });
  });

  describe('Method: getFunctionResult', () => {
    it('stores the completed result and returns the value of the idempotent function', async () => {
      // Prepare
      mockFunctionToMakeIdempotent.mockResolvedValue('result');
      const mockSaveSuccessfulResult = vi
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveSuccess')
        .mockResolvedValue();

      // Act & Assess
      await expect(idempotentHandler.getFunctionResult()).resolves.toBe(
        'result'
      );
      expect(mockSaveSuccessfulResult).toHaveBeenCalledTimes(1);
    });

    it('deletes the in progress record and throws when the idempotent function throws', async () => {
      // Prepare
      mockFunctionToMakeIdempotent.mockRejectedValue(new Error('Some error'));
      const mockDeleteInProgress = vi
        .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
        .mockResolvedValue();

      // Act & Assess
      await expect(idempotentHandler.getFunctionResult()).rejects.toThrow(
        Error
      );
      expect(mockDeleteInProgress).toHaveBeenCalledTimes(1);
    });

    it('throws and wraps the error thrown by the underlying deleteRecord', async () => {
      // Prepare
      mockFunctionToMakeIdempotent.mockRejectedValue(new Error('Some error'));
      const mockDeleteInProgress = vi
        .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
        .mockRejectedValue(new Error('Some error'));

      // Act & Assess
      await expect(idempotentHandler.getFunctionResult()).rejects.toMatchObject(
        {
          name: 'IdempotencyPersistenceLayerError',
          message: 'Failed to delete record from idempotency store',
          cause: new Error('Some error'),
        }
      );
      expect(mockDeleteInProgress).toHaveBeenCalledTimes(1);
    });

    it('throws and wraps the error thrown by the underlying saveSuccessfulResult', async () => {
      // Prepare
      mockFunctionToMakeIdempotent.mockResolvedValue('result');
      const mockSaveSuccessfulResult = vi
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveSuccess')
        .mockRejectedValue(new Error('Some error'));

      // Act & Assess
      await expect(idempotentHandler.getFunctionResult()).rejects.toThrow(
        IdempotencyPersistenceLayerError
      );
      expect(mockSaveSuccessfulResult).toHaveBeenCalledTimes(1);
    });
  });
});

import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { IdempotencyHandler } from '../../src/IdempotencyHandler.js';
import { IdempotencyRecordStatus, MAX_RETRIES } from '../../src/constants.js';
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyConfig,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from '../../src/index.js';
/**
 * Test Idempotency Handler
 *
 * @group unit/idempotency/IdempotencyHandler
 */
import { IdempotencyRecord } from '../../src/persistence/index.js';
import { PersistenceLayerTestClass } from '../helpers/idempotencyUtils.js';

const mockFunctionToMakeIdempotent = jest.fn();
const mockResponseHook = jest
  .fn()
  .mockImplementation((response, record) => response);
const mockFunctionPayloadToBeHashed = {};
const persistenceStore = new PersistenceLayerTestClass();
const mockIdempotencyOptions = {
  persistenceStore,
  dataKeywordArgument: 'testKeywordArgument',
  config: new IdempotencyConfig({
    responseHook: mockResponseHook,
  }),
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

    test('when record is in progress and outside expiry window, it rejects with IdempotencyInconsistentStateError', async () => {
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

    test('when record is expired, it rejects with IdempotencyInconsistentStateError', async () => {
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

    test('when response hook is provided, it should should call responseHook during an idempotent request', () => {
      // Prepare
      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        responseData: { responseData: 'responseData' },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.COMPLETED,
      });

      // Act
      idempotentHandler.determineResultFromIdempotencyRecord(stubRecord);

      // Assess
      expect(mockResponseHook).toHaveBeenCalled();
    });

    test('when response hook is provided, it can manipulate response during an idempotent request', () => {
      // Prepare
      interface HandlerResponse {
        message: string;
        statusCode: number;
        headers?: Record<string, string>;
      }

      const responseHook = jest
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

      const mockResponse: HandlerResponse = {
        message: 'Original message',
        statusCode: 200,
      };

      const idempotencyRecord = {
        getStatus: jest.fn().mockReturnValue(IdempotencyRecordStatus.COMPLETED),
        getResponse: jest.fn().mockReturnValue(mockResponse),
        idempotencyKey: 'test-key',
        isExpired: jest.fn().mockReturnValue(false),
      } as unknown as IdempotencyRecord;

      // Act
      const result =
        idempotentHandler.determineResultFromIdempotencyRecord(
          idempotencyRecord
        );

      // Assess
      expect(responseHook).toHaveBeenCalledWith(
        mockResponse,
        idempotencyRecord
      );
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
    test('when IdempotencyAlreadyInProgressError is thrown, it retries once', async () => {
      // Prepare
      const saveInProgressSpy = jest
        .spyOn(persistenceStore, 'saveInProgress')
        .mockRejectedValueOnce(new IdempotencyItemAlreadyExistsError());

      // Act & Assess
      await expect(idempotentHandler.handle()).rejects.toThrow();
      expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
    });

    test('when IdempotencyAlreadyInProgressError is thrown and it contains the existing item, it returns it directly', async () => {
      // Prepare
      const saveInProgressSpy = jest
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
      const getRecordSpy = jest.spyOn(persistenceStore, 'getRecord');

      // Act & Assess
      await expect(idempotentHandler.handle()).resolves.toEqual('Hi');
      expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
      expect(getRecordSpy).toHaveBeenCalledTimes(0);
    });

    test('when IdempotencyInconsistentStateError is thrown, it retries until max retries are exhausted', async () => {
      // Prepare
      const mockProcessIdempotency = jest
        .spyOn(persistenceStore, 'saveInProgress')
        .mockRejectedValue(new IdempotencyItemAlreadyExistsError());
      jest.spyOn(persistenceStore, 'getRecord').mockResolvedValue(
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
    test('when function returns a result, it saves the successful result and returns it', async () => {
      // Prepare
      mockFunctionToMakeIdempotent.mockResolvedValue('result');
      const mockSaveSuccessfulResult = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveSuccess')
        .mockResolvedValue();

      // Act & Assess
      await expect(idempotentHandler.getFunctionResult()).resolves.toBe(
        'result'
      );
      expect(mockSaveSuccessfulResult).toHaveBeenCalledTimes(1);
    });

    test('when function throws an error, it deletes the in progress record and throws the error', async () => {
      // Prepare
      mockFunctionToMakeIdempotent.mockRejectedValue(new Error('Some error'));
      const mockDeleteInProgress = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
        .mockResolvedValue();

      // Act & Assess
      await expect(idempotentHandler.getFunctionResult()).rejects.toThrow(
        Error
      );
      expect(mockDeleteInProgress).toHaveBeenCalledTimes(1);
    });

    test('when deleteRecord throws an error, it wraps the error to IdempotencyPersistenceLayerError', async () => {
      // Prepare
      mockFunctionToMakeIdempotent.mockRejectedValue(new Error('Some error'));
      const mockDeleteInProgress = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
        .mockRejectedValue(new Error('Some error'));

      // Act & Assess
      await expect(idempotentHandler.getFunctionResult()).rejects.toThrow({
        name: 'IdempotencyPersistenceLayerError',
        message: 'Failed to delete record from idempotency store',
        cause: new Error('Some error'),
      });
      expect(mockDeleteInProgress).toHaveBeenCalledTimes(1);
    });

    test('when saveSuccessfulResult throws an error, it wraps the error to IdempotencyPersistenceLayerError', async () => {
      // Prepare
      mockFunctionToMakeIdempotent.mockResolvedValue('result');
      const mockSaveSuccessfulResult = jest
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

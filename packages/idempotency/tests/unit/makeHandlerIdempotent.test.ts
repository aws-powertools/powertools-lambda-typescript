/**
 * Test Idempotency middleware
 *
 * @group unit/idempotency/makeHandlerIdempotent
 */

import { makeHandlerIdempotent } from '../../src/middleware';
import { helloworldContext as dummyContext } from '../../../commons/src/samples/resources/contexts';
import { Custom as dummyEvent } from '../../../commons/src/samples/resources/events';
import { IdempotencyRecordStatus } from '../../src/types';
import { BasePersistenceLayer, IdempotencyRecord } from '../../src/persistence';
import {
  IdempotencyPersistenceLayerError,
  IdempotencyItemAlreadyExistsError,
} from '../../src/Exceptions';
import { IdempotencyConfig } from '../../src/IdempotencyConfig';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';

jest.spyOn(console, 'debug').mockImplementation(() => null);
jest.spyOn(console, 'warn').mockImplementation(() => null);
jest.spyOn(console, 'error').mockImplementation(() => null);

class PersistenceLayerTestClass extends BasePersistenceLayer {
  protected _deleteRecord = jest.fn();
  protected _getRecord = jest.fn();
  protected _putRecord = jest.fn();
  protected _updateRecord = jest.fn();
}

const mockIdempotencyOptions = {
  persistenceStore: new PersistenceLayerTestClass(),
};
const remainingTImeInMillis = 10000;

describe('Middy middleware', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext;
  context.getRemainingTimeInMillis = jest
    .fn()
    .mockReturnValue(remainingTImeInMillis);
  const event = dummyEvent.CustomEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });
  describe('Middleware: captureLambdaHandler', () => {
    it('handles a successful execution', async () => {
      // Prepare
      const handler = middy(
        async (_event: unknown, _context: Context): Promise<boolean> => true
      ).use(
        makeHandlerIdempotent({
          ...mockIdempotencyOptions,
          config: new IdempotencyConfig({}),
        })
      );
      const saveInProgressSpy = jest.spyOn(
        mockIdempotencyOptions.persistenceStore,
        'saveInProgress'
      );
      const saveSuccessSpy = jest.spyOn(
        mockIdempotencyOptions.persistenceStore,
        'saveSuccess'
      );

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toBe(true);
      expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
      expect(saveInProgressSpy).toHaveBeenCalledWith(
        event,
        remainingTImeInMillis
      );
      expect(saveSuccessSpy).toHaveBeenCalledTimes(1);
      expect(saveSuccessSpy).toHaveBeenCalledWith(event, true);
    });
    it('handles an execution that throws an error', async () => {
      // Prepare
      const handler = middy(
        async (_event: unknown, _context: Context): Promise<boolean> => {
          throw new Error('Something went wrong');
        }
      ).use(makeHandlerIdempotent(mockIdempotencyOptions));
      const saveInProgressSpy = jest.spyOn(
        mockIdempotencyOptions.persistenceStore,
        'saveInProgress'
      );
      const deleteRecordSpy = jest.spyOn(
        mockIdempotencyOptions.persistenceStore,
        'deleteRecord'
      );

      // Act && Assess
      await expect(handler(event, context)).rejects.toThrow();
      expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
      expect(saveInProgressSpy).toHaveBeenCalledWith(
        event,
        remainingTImeInMillis
      );
      expect(deleteRecordSpy).toHaveBeenCalledTimes(1);
      expect(deleteRecordSpy).toHaveBeenCalledWith(event);
    });
    it('thows an error if the persistence layer throws an error when saving in progress', async () => {
      // Prepare
      const handler = middy(
        async (_event: unknown, _context: Context): Promise<boolean> => true
      ).use(makeHandlerIdempotent(mockIdempotencyOptions));
      jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
        .mockRejectedValue(new Error('Something went wrong'));

      // Act && Assess
      await expect(handler(event, context)).rejects.toThrowError(
        new IdempotencyPersistenceLayerError(
          'Failed to save in progress record to idempotency store'
        )
      );
    });
    it('thows an error if the persistence layer throws an error when saving a successful operation', async () => {
      // Prepare
      const handler = middy(
        async (_event: unknown, _context: Context): Promise<boolean> => true
      ).use(makeHandlerIdempotent(mockIdempotencyOptions));
      jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveSuccess')
        .mockRejectedValue(new Error('Something went wrong'));

      // Act && Assess
      await expect(handler(event, context)).rejects.toThrowError(
        new IdempotencyPersistenceLayerError(
          'Failed to update success record to idempotency store'
        )
      );
    });
    it('thows an error if the persistence layer throws an error when deleting a record', async () => {
      // Prepare
      const handler = middy(
        async (_event: unknown, _context: Context): Promise<boolean> => {
          throw new Error('Something went wrong');
        }
      ).use(makeHandlerIdempotent(mockIdempotencyOptions));
      jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
        .mockRejectedValue(new Error('Something went wrong'));

      // Act && Assess
      await expect(handler(event, context)).rejects.toThrow(
        new IdempotencyPersistenceLayerError(
          'Failed to delete record from idempotency store'
        )
      );
    });
    it('returns the stored response if the operation has already been executed', async () => {
      // Prepare
      const handler = middy(
        async (_event: unknown, _context: Context): Promise<boolean> => true
      ).use(makeHandlerIdempotent(mockIdempotencyOptions));
      jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
        .mockRejectedValue(new IdempotencyItemAlreadyExistsError());
      const stubRecord = new IdempotencyRecord({
        idempotencyKey: 'idempotencyKey',
        expiryTimestamp: Date.now() + 10000,
        inProgressExpiryTimestamp: 0,
        responseData: { response: false },
        payloadHash: 'payloadHash',
        status: IdempotencyRecordStatus.COMPLETED,
      });
      const getRecordSpy = jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'getRecord')
        .mockResolvedValue(stubRecord);

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ response: false });
      expect(getRecordSpy).toHaveBeenCalledTimes(1);
      expect(getRecordSpy).toHaveBeenCalledWith(event);
    });
  });
});

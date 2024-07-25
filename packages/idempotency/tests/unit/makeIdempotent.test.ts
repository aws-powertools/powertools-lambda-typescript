import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { MAX_RETRIES } from '../../src/constants.js';
import {
  IdempotencyConfig,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
  IdempotencyRecordStatus,
  IdempotencyUnknownError,
  makeIdempotent,
} from '../../src/index.js';
/**
 * Test makeIdempotent Function Wrapper
 *
 * @group unit/idempotency/makeIdempotent
 */
import { IdempotencyRecord } from '../../src/persistence/index.js';
import { PersistenceLayerTestClass } from '../helpers/idempotencyUtils.js';

const mockIdempotencyOptions = {
  persistenceStore: new PersistenceLayerTestClass(),
};
const remainingTImeInMillis = 1234;

describe('Function: makeIdempotent', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const event = {
    foo: 'bar',
    bar: 'baz',
  };

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

  it('handles a successful execution', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, context: Context) => context.awsRequestId,
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
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
    expect(result).toBe(context.awsRequestId);
    expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
    expect(saveInProgressSpy).toHaveBeenCalledWith(
      event,
      remainingTImeInMillis
    );
    expect(saveSuccessSpy).toHaveBeenCalledTimes(1);
    expect(saveSuccessSpy).toHaveBeenCalledWith(event, context.awsRequestId);
  });
  it('handles an execution that throws an error', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => {
        throw new Error('Something went wrong');
      },
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
    );
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
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => true,
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
    );
    jest
      .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
      .mockRejectedValue(new Error('Something went wrong'));

    // Act && Assess
    await expect(handler(event, context)).rejects.toThrowError(
      new IdempotencyPersistenceLayerError(
        'Failed to save in progress record to idempotency store',
        new Error('Something went wrong')
      )
    );
  });
  it('thows an error if the persistence layer throws an error when saving a successful operation', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => true,
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
    );
    jest
      .spyOn(mockIdempotencyOptions.persistenceStore, 'saveSuccess')
      .mockRejectedValue(new Error('Something went wrong'));

    // Act && Assess
    await expect(handler(event, context)).rejects.toThrowError(
      new IdempotencyPersistenceLayerError(
        'Failed to update success record to idempotency store',
        new Error('Something went wrong')
      )
    );
  });
  it('thows an error if the persistence layer throws an error when deleting a record', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => {
        throw new Error('Something went wrong');
      },
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
    );
    jest
      .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
      .mockRejectedValue(new Error('Something went wrong'));

    // Act && Assess
    await expect(handler(event, context)).rejects.toThrow(
      new IdempotencyPersistenceLayerError(
        'Failed to delete record from idempotency store',
        new Error('Something went wrong')
      )
    );
  });
  it('returns the stored response if the operation has already been executed', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => true,
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
    );
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
  it('retries if the record is in an inconsistent state', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => true,
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
    );
    jest
      .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
      .mockRejectedValue(new IdempotencyItemAlreadyExistsError());
    const stubRecordInconsistent = new IdempotencyRecord({
      idempotencyKey: 'idempotencyKey',
      expiryTimestamp: Date.now() + 10000,
      inProgressExpiryTimestamp: 0,
      responseData: { response: false },
      payloadHash: 'payloadHash',
      status: IdempotencyRecordStatus.EXPIRED,
    });
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
      .mockResolvedValueOnce(stubRecordInconsistent)
      .mockResolvedValueOnce(stubRecord);

    // Act
    const result = await handler(event, context);

    // Assess
    expect(result).toStrictEqual({ response: false });
    expect(getRecordSpy).toHaveBeenCalledTimes(2);
  });
  it('throws after all the retries have been exhausted if the record is in an inconsistent state', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => true,
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
    );
    jest
      .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
      .mockRejectedValue(new IdempotencyItemAlreadyExistsError());
    const stubRecordInconsistent = new IdempotencyRecord({
      idempotencyKey: 'idempotencyKey',
      expiryTimestamp: Date.now() + 10000,
      inProgressExpiryTimestamp: 0,
      responseData: { response: false },
      payloadHash: 'payloadHash',
      status: IdempotencyRecordStatus.EXPIRED,
    });
    const getRecordSpy = jest
      .spyOn(mockIdempotencyOptions.persistenceStore, 'getRecord')
      .mockResolvedValue(stubRecordInconsistent);

    // Act & Assess
    await expect(handler(event, context)).rejects.toThrow(
      new IdempotencyInconsistentStateError(
        'Item has expired during processing and may not longer be valid.'
      )
    );
    expect(getRecordSpy).toHaveBeenCalledTimes(MAX_RETRIES + 1);
  });
  it('throws immediately if an object other than an error was thrown', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => {
        throw 'Something went wrong';
      },
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({}),
      }
    );
    const saveSuccessSpy = jest.spyOn(
      mockIdempotencyOptions.persistenceStore,
      'saveSuccess'
    );

    // Act & Assess
    await expect(handler(event, context)).rejects.toThrow(
      new IdempotencyUnknownError(
        'An unknown error occurred while processing the request.'
      )
    );
    expect(saveSuccessSpy).toHaveBeenCalledTimes(0);
  });
  it('does not do anything if idempotency is disabled', async () => {
    // Prepare
    process.env.POWERTOOLS_IDEMPOTENCY_DISABLED = 'true';
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => true,
      {
        ...mockIdempotencyOptions,
      }
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
    expect(saveInProgressSpy).toHaveBeenCalledTimes(0);
    expect(saveSuccessSpy).toHaveBeenCalledTimes(0);
  });

  it('skips idempotency if no idempotency key is provided and throwOnNoIdempotencyKey is false', async () => {
    // Prepare
    const handler = makeIdempotent(
      async (_event: unknown, _context: Context) => true,
      {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({
          eventKeyJmesPath: 'idempotencyKey',
          throwOnNoIdempotencyKey: false,
        }),
      }
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
    expect(saveInProgressSpy).toHaveBeenCalledTimes(0);
    expect(saveSuccessSpy).toHaveBeenCalledTimes(0);
  });
  it('when wrapping an arbitrary function it uses the first argument as payload by default', async () => {
    // Prepare
    const config = new IdempotencyConfig({});
    config.registerLambdaContext(context);

    const arbitraryFn = makeIdempotent(
      async (foo: { bar: string }, baz: string) => `${foo.bar}${baz}`,
      {
        ...mockIdempotencyOptions,
        config,
      }
    );
    const saveInProgressSpy = jest.spyOn(
      mockIdempotencyOptions.persistenceStore,
      'saveInProgress'
    );
    const saveSuccessSpy = jest.spyOn(
      mockIdempotencyOptions.persistenceStore,
      'saveSuccess'
    );
    const event = { bar: '123' };

    // Act
    const result = await arbitraryFn(event, '456');

    // Assess
    expect(result).toBe('123456');
    expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
    expect(saveInProgressSpy).toHaveBeenCalledWith(
      event,
      remainingTImeInMillis
    );
    expect(saveSuccessSpy).toHaveBeenCalledTimes(1);
    expect(saveSuccessSpy).toHaveBeenCalledWith(event, '123456');
  });
  it('when wrapping an arbitrary function it uses the argument specified as payload by default', async () => {
    // Prepare
    const config = new IdempotencyConfig({});
    config.registerLambdaContext(context);

    const arbitraryFn = makeIdempotent(
      async (foo: { bar: string }, baz: string) => `${foo.bar}${baz}`,
      {
        ...mockIdempotencyOptions,
        config,
        dataIndexArgument: 1,
      }
    );
    const saveInProgressSpy = jest.spyOn(
      mockIdempotencyOptions.persistenceStore,
      'saveInProgress'
    );
    const saveSuccessSpy = jest.spyOn(
      mockIdempotencyOptions.persistenceStore,
      'saveSuccess'
    );
    const event = { bar: '123' };

    // Act
    const result = await arbitraryFn(event, '456');

    // Assess
    expect(result).toBe('123456');
    expect(saveInProgressSpy).toHaveBeenCalledTimes(1);
    expect(saveInProgressSpy).toHaveBeenCalledWith(
      '456',
      remainingTImeInMillis
    );
    expect(saveSuccessSpy).toHaveBeenCalledTimes(1);
    expect(saveSuccessSpy).toHaveBeenCalledWith('456', '123456');
  });
});

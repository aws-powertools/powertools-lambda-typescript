/**
 * Test makeIdempotent function wrapper and middleware
 *
 * @group unit/idempotency
 */
import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { MAX_RETRIES } from '../../src/constants.js';
import {
  IdempotencyConfig,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyRecordStatus,
  IdempotencyUnknownError,
  makeIdempotent,
} from '../../src/index.js';
import { makeHandlerIdempotent } from '../../src/middleware/makeHandlerIdempotent.js';
import { IdempotencyRecord } from '../../src/persistence/index.js';
import { PersistenceLayerTestClass } from '../helpers/idempotencyUtils.js';

const mockIdempotencyOptions = {
  persistenceStore: new PersistenceLayerTestClass(),
};
const remainingTImeInMillis = 1234;
const fnSuccessfull = async () => true;
const fnError = async () => {
  throw new Error('Something went wrong');
};

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

  it.each([
    {
      type: 'wrapper',
    },
    {
      type: 'middleware',
    },
  ])('handles a successful execution ($type)', async ({ type }) => {
    // Prepare
    const fn = async (_event: unknown, context: Context) =>
      context.awsRequestId;
    const handler =
      type === 'wrapper'
        ? makeIdempotent(fn, mockIdempotencyOptions)
        : middy(fn).use(makeHandlerIdempotent(mockIdempotencyOptions));
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

  it.each([
    {
      type: 'wrapper',
    },
    {
      type: 'middleware',
    },
  ])('handles an execution that throws an error ($type)', async ({ type }) => {
    // Prepare
    const handler =
      type === 'wrapper'
        ? makeIdempotent(fnError, mockIdempotencyOptions)
        : middy(fnError).use(makeHandlerIdempotent(mockIdempotencyOptions));
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

  it.each([
    {
      type: 'wrapper',
    },
    {
      type: 'middleware',
    },
  ])(
    'thows an error if the persistence layer throws an error when saving in progress ($type)',
    async ({ type }) => {
      // Prepare
      const handler =
        type === 'wrapper'
          ? makeIdempotent(fnSuccessfull, mockIdempotencyOptions)
          : middy(fnSuccessfull).use(
              makeHandlerIdempotent(mockIdempotencyOptions)
            );
      jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
        .mockRejectedValue(new Error('Something went wrong'));

      // Act && Assess
      await expect(handler(event, context)).rejects.toThrow({
        name: 'IdempotencyPersistenceLayerError',
        message: 'Failed to save in progress record to idempotency store',
      });
    }
  );

  it.each([{ type: 'wrapper' }, { type: 'middleware' }])(
    'thows an error if the persistence layer throws an error when saving a successful operation ($type)',
    async ({ type }) => {
      // Prepare
      const handler =
        type === 'wrapper'
          ? makeIdempotent(fnSuccessfull, mockIdempotencyOptions)
          : middy(fnSuccessfull).use(
              makeHandlerIdempotent(mockIdempotencyOptions)
            );
      jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'saveSuccess')
        .mockRejectedValue(new Error('Something went wrong'));

      // Act && Assess
      await expect(handler(event, context)).rejects.toThrow({
        name: 'IdempotencyPersistenceLayerError',
        message: 'Failed to update success record to idempotency store',
      });
    }
  );

  it.each([{ type: 'wrapper' }, { type: 'middleware' }])(
    'thows an error if the persistence layer throws an error when deleting a record ($type)',
    async ({ type }) => {
      // Prepare
      const handler =
        type === 'wrapper'
          ? makeIdempotent(fnError, mockIdempotencyOptions)
          : middy(fnError).use(makeHandlerIdempotent(mockIdempotencyOptions));
      jest
        .spyOn(mockIdempotencyOptions.persistenceStore, 'deleteRecord')
        .mockRejectedValue(new Error('Something went wrong'));

      // Act && Assess
      await expect(handler(event, context)).rejects.toThrow({
        name: 'IdempotencyPersistenceLayerError',
        message: 'Failed to delete record from idempotency store',
      });
    }
  );

  it.each([
    {
      type: 'wrapper',
    },
    { type: 'middleware' },
  ])(
    'returns the stored response if the operation has already been performed ($type)',
    async ({ type }) => {
      // Prepare
      const handler =
        type === 'wrapper'
          ? makeIdempotent(fnSuccessfull, mockIdempotencyOptions)
          : middy(fnSuccessfull).use(
              makeHandlerIdempotent(mockIdempotencyOptions)
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
    }
  );

  it.each([
    {
      type: 'wrapper',
    },
    { type: 'middleware' },
  ])(
    'retries if the record is in an inconsistent state ($type)',
    async ({ type }) => {
      // Prepare
      const handler =
        type === 'wrapper'
          ? makeIdempotent(fnSuccessfull, mockIdempotencyOptions)
          : middy(fnSuccessfull).use(
              makeHandlerIdempotent(mockIdempotencyOptions)
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
    }
  );

  it.each([
    {
      type: 'wrapper',
    },
    { type: 'middleware' },
  ])(
    'throws after all the retries have been exhausted if the record is in an inconsistent state ($type)',
    async ({ type }) => {
      // Prepare
      const handler =
        type === 'wrapper'
          ? makeIdempotent(fnSuccessfull, mockIdempotencyOptions)
          : middy(fnSuccessfull).use(
              makeHandlerIdempotent(mockIdempotencyOptions)
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
    }
  );

  it.each([
    {
      type: 'wrapper',
    },
    { type: 'middleware' },
  ])(
    'does not do anything if idempotency is disabled ($type)',
    async ({ type }) => {
      // Prepare
      process.env.POWERTOOLS_IDEMPOTENCY_DISABLED = 'true';
      const handler =
        type === 'wrapper'
          ? makeIdempotent(fnSuccessfull, mockIdempotencyOptions)
          : middy(fnSuccessfull).use(
              makeHandlerIdempotent(mockIdempotencyOptions)
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
    }
  );

  it.each([
    {
      type: 'wrapper',
    },
    { type: 'middleware' },
  ])(
    'skips idempotency if no idempotency key is provided and throwOnNoIdempotencyKey is false ($type)',
    async ({ type }) => {
      // Prepare
      const options = {
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({
          eventKeyJmesPath: 'idempotencyKey',
          throwOnNoIdempotencyKey: false,
        }),
      };
      const handler =
        type === 'wrapper'
          ? makeIdempotent(fnSuccessfull, options)
          : middy(fnSuccessfull).use(makeHandlerIdempotent(options));
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
    }
  );
  it('uses the first argument when when wrapping an arbitrary function', async () => {
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

  it('uses the specified argument as payload when wrapping an arbitrary function', async () => {
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

  it('skips idempotency if error is thrown in the middleware', async () => {
    const handler = middy(fnError).use(
      makeHandlerIdempotent({
        ...mockIdempotencyOptions,
        config: new IdempotencyConfig({
          eventKeyJmesPath: 'idempotencyKey',
          throwOnNoIdempotencyKey: false,
        }),
      })
    );
    const deleteRecordSpy = jest.spyOn(
      mockIdempotencyOptions.persistenceStore,
      'deleteRecord'
    );

    await expect(handler(event, context)).rejects.toThrow();

    expect(deleteRecordSpy).toHaveBeenCalledTimes(0);
  });

  it('throws immediately if an object other than an error was thrown (wrapper)', async () => {
    // Prepare
    const fn = async (_event: unknown, _context: Context) => {
      throw 'a string';
    };
    const handler = makeIdempotent(fn, mockIdempotencyOptions);

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

  it('throws immediately if an object other than an error was thrown (middleware)', async () => {
    // Prepare
    const handler = middy(fnSuccessfull).use(
      makeHandlerIdempotent(mockIdempotencyOptions)
    );
    jest
      .spyOn(mockIdempotencyOptions.persistenceStore, 'saveInProgress')
      .mockImplementationOnce(() => {
        throw 'Something went wrong';
      });
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
      new IdempotencyUnknownError(
        'An unknown error occurred while processing the request.'
      )
    );
    expect(getRecordSpy).toHaveBeenCalledTimes(0);
  });
});

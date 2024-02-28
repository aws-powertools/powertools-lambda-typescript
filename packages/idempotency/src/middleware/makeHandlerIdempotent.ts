import { IdempotencyHandler } from '../IdempotencyHandler.js';
import { IdempotencyConfig } from '../IdempotencyConfig.js';
import {
  cleanupMiddlewares,
  IDEMPOTENCY_KEY,
} from '@aws-lambda-powertools/commons';
import type {
  AnyFunction,
  IdempotencyLambdaHandlerOptions,
} from '../types/IdempotencyOptions.js';
import type {
  MiddlewareLikeObj,
  MiddyLikeRequest,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';

/**
 * @internal
 * Utility function to get the idempotency handler from the request internal storage
 *
 * @param request The Middy request object
 * @returns The idempotency handler from the request internal
 */
const getIdempotencyHandlerFromRequestInternal = (
  request: MiddyLikeRequest
): IdempotencyHandler<AnyFunction> => {
  const idempotencyHandler = request.internal[
    `${IDEMPOTENCY_KEY}.idempotencyHandler`
  ] as IdempotencyHandler<AnyFunction>;

  return idempotencyHandler;
};

/**
 * @internal
 * Utility function to set the idempotency handler in the request internal storage
 *
 * @param request The Middy request object
 * @param idempotencyHandler The idempotency handler to set in the request internal
 */
const setIdempotencyHandlerInRequestInternal = (
  request: MiddyLikeRequest,
  idempotencyHandler: IdempotencyHandler<AnyFunction>
): void => {
  request.internal[`${IDEMPOTENCY_KEY}.idempotencyHandler`] =
    idempotencyHandler;
};

/**
 * @internal
 * Utility function to set a flag in the request internal storage to skip the idempotency middleware
 * This is used to skip the idempotency middleware when the idempotency key is not present in the payload
 * or when idempotency is disabled
 *
 * @param request The Middy request object
 */
const setIdempotencySkipFlag = (request: MiddyLikeRequest): void => {
  request.internal[`${IDEMPOTENCY_KEY}.skip`] = true;
};

/**
 * @internal
 * Utility function to get the idempotency key from the request internal storage
 * and determine if the request should skip the idempotency middleware
 *
 * @param request The Middy request object
 * @returns Whether the idempotency middleware should be skipped
 */
const shouldSkipIdempotency = (request: MiddyLikeRequest): boolean => {
  return request.internal[`${IDEMPOTENCY_KEY}.skip`] === true;
};

/**
 * A middy middleware to make your Lambda Handler idempotent.
 *
 * @example
 * ```typescript
 * import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
 * import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
 * import middy from '@middy/core';
 *
 * const persistenceStore = new DynamoDBPersistenceLayer({
 *  tableName: 'idempotencyTable',
 * });
 *
 * export const handler = middy(
 *   async (_event: unknown, _context: unknown): Promise<void> => {
 *     // your code goes here
 *   }
 * ).use(makeHandlerIdempotent({ persistenceStore: dynamoDBPersistenceLayer }));
 * ```
 *
 * @param options - Options for the idempotency middleware
 */
const makeHandlerIdempotent = (
  options: IdempotencyLambdaHandlerOptions
): MiddlewareLikeObj => {
  /**
   * Function called before the handler is executed.
   *
   * Before the handler is executed, we insantiate the {@link IdempotencyHandler} and
   * set it in the request internal storage. We then configure the persistence store
   * and set the payload to be hashed and Lambda context in the idempotency config.
   *
   * If idempotency is enabled and the idempotency key is present in the payload,
   * we then run the idempotency operations. These are handled in {@link IdempotencyHandler.handleMiddyBefore}.
   *
   * @param request - The Middy request object
   */
  const before = async (request: MiddyLikeRequest): Promise<unknown> => {
    const idempotencyConfig = options.config
      ? options.config
      : new IdempotencyConfig({});
    const persistenceStore = options.persistenceStore;
    persistenceStore.configure({
      config: idempotencyConfig,
    });

    const idempotencyHandler = new IdempotencyHandler({
      functionToMakeIdempotent: /* istanbul ignore next */ () => ({}),
      functionArguments: [],
      idempotencyConfig,
      persistenceStore,
      functionPayloadToBeHashed: undefined,
    });
    setIdempotencyHandlerInRequestInternal(request, idempotencyHandler);

    // set the payload to be hashed
    idempotencyHandler.setFunctionPayloadToBeHashed(request.event as JSONValue);
    // check if we should skip idempotency checks
    if (idempotencyHandler.shouldSkipIdempotency()) {
      // set the flag to skip checks in after and onError
      setIdempotencySkipFlag(request);

      return;
    }

    idempotencyConfig.registerLambdaContext(request.context);

    return idempotencyHandler.handleMiddyBefore(request, cleanupMiddlewares);
  };

  /**
   * Function called after the handler has executed successfully.
   *
   * When the handler returns successfully, we need to update the record in the
   * idempotency store to indicate that the execution has completed and
   * store its result. This is handled in {@link IdempotencyHandler.handleMiddyAfter}.
   *
   * @param request - The Middy request object
   */
  const after = async (request: MiddyLikeRequest): Promise<void> => {
    if (shouldSkipIdempotency(request)) {
      return;
    }
    const idempotencyHandler =
      getIdempotencyHandlerFromRequestInternal(request);
    await idempotencyHandler.handleMiddyAfter(request.response);
  };

  /**
   * Function called when an error occurs in the handler.
   *
   * When an error is thrown in the handler, we need to delete the record from the
   * idempotency store. This is handled in {@link IdempotencyHandler.handleMiddyOnError}.
   *
   * @param request - The Middy request object
   */
  const onError = async (request: MiddyLikeRequest): Promise<void> => {
    if (shouldSkipIdempotency(request)) {
      return;
    }
    const idempotencyHandler =
      getIdempotencyHandlerFromRequestInternal(request);
    await idempotencyHandler.handleMiddyOnError();
  };

  return {
    before,
    after,
    onError,
  };
};

export { makeHandlerIdempotent };

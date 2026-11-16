import { cleanupMiddlewares } from '@aws-lambda-powertools/commons';
import type {
  JSONValue,
  MiddlewareLikeObj,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import { IdempotencyConfig } from '../IdempotencyConfig.js';
import { IdempotencyHandler } from '../IdempotencyHandler.js';
import type {
  AnyFunction,
  IdempotencyLambdaHandlerOptions,
} from '../types/IdempotencyOptions.js';

/**
 * @internal
 * The state that the middleware keeps for the invocation it is handling.
 *
 * @property idempotencyHandler - the handler that runs the idempotency logic of the invocation
 * @property skip - whether the invocation runs without idempotency
 * @property ownsRecord - whether the invocation acquired an in-progress record it has not yet completed
 */
type IdempotencyRequestState = {
  idempotencyHandler: IdempotencyHandler<AnyFunction>;
  skip: boolean;
  ownsRecord: boolean;
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
 * For the middleware to work, your Lambda function handler must return a value different from `undefined`.
 * This is a [known limitation of the early return feature in Middy.js](https://github.com/middyjs/middy/issues/1236).
 *
 * If your use case requires early returns, you can use the {@link index.makeIdempotent | makeIdempotent()} function wrapper instead.
 *
 * @param options - Options for the idempotency middleware
 */
const makeHandlerIdempotent = (
  options: IdempotencyLambdaHandlerOptions
): MiddlewareLikeObj => {
  /**
   * The state of each invocation being handled, keyed by its Middy request object.
   *
   * `request.internal` is shared across invocations when the handler is created with
   * the `internal` option, so state kept there would be overwritten by an invocation
   * that starts while another one is in flight. Middy builds a request object for
   * each invocation instead, and drops it once the invocation ends.
   */
  const requestState = new WeakMap<MiddyLikeRequest, IdempotencyRequestState>();

  /**
   * Function called before the handler is executed.
   *
   * Before the handler is executed, we insantiate the {@link IdempotencyHandler} and
   * store it in the state of the invocation. We then configure the persistence store
   * and set the payload to be hashed and Lambda context in the idempotency config.
   *
   * If idempotency is enabled and the idempotency key is present in the payload,
   * we then run the idempotency operations. These are handled in {@link IdempotencyHandler.handleMiddyBefore}.
   * A stored response is returned early; otherwise this request now owns the
   * in-progress record and `onError` is allowed to delete it.
   *
   * @param request - The Middy request object
   */
  const before = async (request: MiddyLikeRequest): Promise<unknown> => {
    const idempotencyConfig = options.config ?? new IdempotencyConfig({});
    const persistenceStore = options.persistenceStore;
    const keyPrefix = options.keyPrefix;
    persistenceStore.configure({
      config: idempotencyConfig,
      keyPrefix: keyPrefix,
    });

    const idempotencyHandler = new IdempotencyHandler({
      /* v8 ignore start */
      functionToMakeIdempotent: () => ({}),
      /* v8 ignore stop */
      functionArguments: [],
      idempotencyConfig,
      persistenceStore,
      keyPrefix,
      functionPayloadToBeHashed: undefined,
    });
    const state: IdempotencyRequestState = {
      idempotencyHandler,
      skip: false,
      ownsRecord: false,
    };
    requestState.set(request, state);

    // set the payload to be hashed
    idempotencyHandler.setFunctionPayloadToBeHashed(request.event as JSONValue);
    // check if we should skip idempotency checks
    if (idempotencyHandler.shouldSkipIdempotency()) {
      // set the flag to skip checks in after and onError
      state.skip = true;

      return;
    }

    idempotencyConfig.registerLambdaContext(request.context);

    // the cleanup callback only runs when a stored response is replayed
    let replayed = false;
    const result = await idempotencyHandler.handleMiddyBefore(
      request,
      async (request) => {
        replayed = true;
        await cleanupMiddlewares(request);
      }
    );
    if (!replayed) {
      state.ownsRecord = true;
    }

    return result;
  };

  /**
   * Function called after the handler has executed successfully.
   *
   * When the handler returns successfully, we need to update the record in the
   * idempotency store to indicate that the execution has completed and
   * store its result. This is handled in {@link IdempotencyHandler.handleMiddyAfter}.
   *
   * Ownership is released before saving so that a failure to store the result
   * does not delete the record, in line with the function wrapper.
   *
   * @param request - The Middy request object
   */
  const after = async (request: MiddyLikeRequest): Promise<void> => {
    const state = requestState.get(request);
    if (state === undefined || state.skip) {
      return;
    }
    state.ownsRecord = false;
    await state.idempotencyHandler.handleMiddyAfter(request.response);
  };

  /**
   * Function called when an error occurs in the handler.
   *
   * When an error is thrown in the handler, we need to delete the record from the
   * idempotency store. This is handled in {@link IdempotencyHandler.handleMiddyOnError}.
   *
   * The record is left untouched when this request never acquired it, for example
   * when `before` rejected a concurrent or mismatching request, or once the
   * handler has returned and its result is being stored.
   *
   * @param request - The Middy request object
   */
  const onError = async (request: MiddyLikeRequest): Promise<void> => {
    const state = requestState.get(request);
    if (state === undefined || state.skip || !state.ownsRecord) {
      return;
    }
    await state.idempotencyHandler.handleMiddyOnError();
  };

  return {
    before,
    after,
    onError,
  };
};

export { makeHandlerIdempotent };

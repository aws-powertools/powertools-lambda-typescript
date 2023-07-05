import { IdempotencyHandler } from '../IdempotencyHandler';
import { IdempotencyConfig } from '../IdempotencyConfig';
import { cleanupMiddlewares } from '@aws-lambda-powertools/commons/lib/middleware';
import {
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from '../errors';
import { IdempotencyRecord } from '../persistence';
import { MAX_RETRIES } from '../constants';
import type { IdempotencyLambdaHandlerOptions } from '../types';
import {
  MiddlewareLikeObj,
  MiddyLikeRequest,
  JSONValue,
} from '@aws-lambda-powertools/commons';

/**
 * A middy middleware to make your Lambda Handler idempotent.
 *
 * @example
 * ```typescript
 * import {
 *   makeHandlerIdempotent,
 *   DynamoDBPersistenceLayer,
 * } from '@aws-lambda-powertools/idempotency';
 * import middy from '@middy/core';
 *
 * const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer({
 *   tableName: 'idempotencyTable',
 * });
 *
 * const lambdaHandler = async (_event: unknown, _context: unknown) => {
 *   //...
 * };
 *
 * export const handler = middy(lambdaHandler)
 *  .use(makeHandlerIdempotent({ persistenceStore: dynamoDBPersistenceLayer }));
 * ```
 *
 * @param options - Options for the idempotency middleware
 */
const makeHandlerIdempotent = (
  options: IdempotencyLambdaHandlerOptions
): MiddlewareLikeObj => {
  const idempotencyConfig = options.config
    ? options.config
    : new IdempotencyConfig({});
  const persistenceStore = options.persistenceStore;
  persistenceStore.configure({
    config: idempotencyConfig,
  });

  // keep the flag for after and onError checks
  let shouldSkipIdempotency = false;

  /**
   * Function called before the handler is executed.
   *
   * Before the handler is executed, we need to check if there is already an
   * execution in progress for the given idempotency key. If there is, we
   * need to determine its status and return the appropriate response or
   * throw an error.
   *
   * If there is no execution in progress, we need to save a record to the
   * idempotency store to indicate that an execution is in progress.
   *
   * In some rare cases, when the persistent state changes in small time
   * window, we might get an `IdempotencyInconsistentStateError`. In such
   * cases we can safely retry the handling a few times.
   *
   * @param request - The Middy request object
   * @param retryNo - The number of times the handler has been retried
   */
  const before = async (
    request: MiddyLikeRequest,
    retryNo = 0
  ): Promise<unknown | void> => {
    if (
      IdempotencyHandler.shouldSkipIdempotency(
        idempotencyConfig.eventKeyJmesPath,
        idempotencyConfig.throwOnNoIdempotencyKey,
        request.event as JSONValue
      )
    ) {
      // set the flag to skip checks in after and onError
      shouldSkipIdempotency = true;

      return;
    }
    try {
      await persistenceStore.saveInProgress(
        request.event as JSONValue,
        request.context.getRemainingTimeInMillis()
      );
    } catch (error) {
      if (error instanceof IdempotencyItemAlreadyExistsError) {
        const idempotencyRecord: IdempotencyRecord =
          await persistenceStore.getRecord(request.event as JSONValue);

        try {
          const response =
            await IdempotencyHandler.determineResultFromIdempotencyRecord(
              idempotencyRecord
            );
          if (response) {
            // Cleanup other middlewares
            cleanupMiddlewares(request);

            return response;
          }
        } catch (error) {
          if (
            error instanceof IdempotencyInconsistentStateError &&
            retryNo < MAX_RETRIES
          ) {
            // Retry
            return await before(request, retryNo + 1);
          } else {
            // Retries exhausted or other error
            throw error;
          }
        }
      } else {
        throw new IdempotencyPersistenceLayerError(
          'Failed to save in progress record to idempotency store',
          error as Error
        );
      }
    }
  };
  /**
   * Function called after the handler has executed successfully.
   *
   * When the handler returns successfully, we need to update the record in the
   * idempotency store to indicate that the execution has completed and
   * store its result.
   *
   * @param request - The Middy request object
   */
  const after = async (request: MiddyLikeRequest): Promise<void> => {
    if (shouldSkipIdempotency) {
      return;
    }
    try {
      await persistenceStore.saveSuccess(
        request.event as JSONValue,
        request.response as JSONValue
      );
    } catch (e) {
      throw new IdempotencyPersistenceLayerError(
        'Failed to update success record to idempotency store',
        e as Error
      );
    }
  };

  /**
   * Function called when an error occurs in the handler.
   *
   * When an error is thrown in the handler, we need to delete the record from the
   * idempotency store.
   *
   * @param request - The Middy request object
   */
  const onError = async (request: MiddyLikeRequest): Promise<void> => {
    if (shouldSkipIdempotency) {
      return;
    }
    try {
      await persistenceStore.deleteRecord(request.event as JSONValue);
    } catch (error) {
      throw new IdempotencyPersistenceLayerError(
        'Failed to delete record from idempotency store',
        error as Error
      );
    }
  };

  if (idempotencyConfig.isEnabled()) {
    return {
      before,
      after,
      onError,
    };
  } else {
    return {
      before: () => {
        return undefined;
      },
    };
  }
};

export { makeHandlerIdempotent };

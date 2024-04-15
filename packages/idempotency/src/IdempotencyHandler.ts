import type {
  JSONValue,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import type {
  AnyFunction,
  IdempotencyHandlerOptions,
} from './types/IdempotencyOptions.js';
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from './errors.js';
import { BasePersistenceLayer } from './persistence/BasePersistenceLayer.js';
import { IdempotencyRecord } from './persistence/IdempotencyRecord.js';
import { IdempotencyConfig } from './IdempotencyConfig.js';
import { MAX_RETRIES, IdempotencyRecordStatus } from './constants.js';
import { search } from '@aws-lambda-powertools/jmespath';
import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';

/**
 * @internal
 *
 * Class that handles the idempotency lifecycle.
 *
 * This class is used under the hood by the Idempotency utility
 * and provides several methods that are called at different stages
 * to orchestrate the idempotency logic.
 */
export class IdempotencyHandler<Func extends AnyFunction> {
  /**
   * The arguments passed to the function.
   *
   * For example, if the function is `foo(a, b)`, then `functionArguments` will be `[a, b]`.
   * We need to keep track of the arguments so that we can pass them to the function when we call it.
   */
  readonly #functionArguments: unknown[];
  /**
   * The payload to be hashed.
   *
   * This is the argument that is used for the idempotency.
   */
  #functionPayloadToBeHashed: JSONValue;
  /**
   * Reference to the function to be made idempotent.
   */
  readonly #functionToMakeIdempotent: AnyFunction;
  /**
   * Idempotency configuration options.
   */
  readonly #idempotencyConfig: IdempotencyConfig;
  /**
   * Persistence layer used to store the idempotency records.
   */
  readonly #persistenceStore: BasePersistenceLayer;

  public constructor(options: IdempotencyHandlerOptions) {
    const {
      functionToMakeIdempotent,
      functionPayloadToBeHashed,
      idempotencyConfig,
      functionArguments,
      persistenceStore,
    } = options;
    this.#functionToMakeIdempotent = functionToMakeIdempotent;
    this.#functionPayloadToBeHashed = functionPayloadToBeHashed;
    this.#idempotencyConfig = idempotencyConfig;
    this.#functionArguments = functionArguments;

    this.#persistenceStore = persistenceStore;

    this.#persistenceStore.configure({
      config: this.#idempotencyConfig,
    });
  }

  /**
   * Takes an idempotency key and returns the idempotency record from the persistence layer.
   *
   * If the idempotency record is not COMPLETE, then it will throw an error based on the status of the record.
   *
   * @param idempotencyRecord The idempotency record stored in the persistence layer
   * @returns The result of the function if the idempotency record is in a terminal state
   */
  public static determineResultFromIdempotencyRecord(
    idempotencyRecord: IdempotencyRecord
  ): JSONValue {
    if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.EXPIRED) {
      throw new IdempotencyInconsistentStateError(
        'Item has expired during processing and may not longer be valid.'
      );
    } else if (
      idempotencyRecord.getStatus() === IdempotencyRecordStatus.INPROGRESS
    ) {
      if (
        idempotencyRecord.inProgressExpiryTimestamp &&
        idempotencyRecord.inProgressExpiryTimestamp <
          new Date().getUTCMilliseconds()
      ) {
        throw new IdempotencyInconsistentStateError(
          'Item is in progress but the in progress expiry timestamp has expired.'
        );
      } else {
        throw new IdempotencyAlreadyInProgressError(
          `There is already an execution in progress with idempotency key: ${idempotencyRecord.idempotencyKey}`
        );
      }
    }

    return idempotencyRecord.getResponse();
  }

  /**
   * Execute the handler and return the result.
   *
   * If the handler fails, the idempotency record will be deleted.
   * If it succeeds, the idempotency record will be updated with the result.
   *
   * @returns The result of the function execution
   */
  public async getFunctionResult(): Promise<ReturnType<Func>> {
    let result;
    try {
      result = await this.#functionToMakeIdempotent(...this.#functionArguments);
    } catch (error) {
      await this.#deleteInProgressRecord();
      throw error;
    }
    await this.#saveSuccessfullResult(result);

    return result;
  }

  /**
   * Entry point to handle the idempotency logic.
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
   */
  public async handle(): Promise<ReturnType<Func>> {
    // early return if we should skip idempotency completely
    if (this.shouldSkipIdempotency()) {
      return await this.#functionToMakeIdempotent(...this.#functionArguments);
    }

    let e;
    for (let retryNo = 0; retryNo <= MAX_RETRIES; retryNo++) {
      try {
        const result = await this.#saveInProgressOrReturnExistingResult();
        if (result) return result as ReturnType<Func>;

        return await this.getFunctionResult();
      } catch (error) {
        if (
          error instanceof IdempotencyInconsistentStateError &&
          retryNo < MAX_RETRIES
        ) {
          // Retry
          continue;
        }
        // Retries exhausted or other error
        e = error;
        break;
      }
    }
    throw e;
  }

  /**
   * Handle the idempotency operations needed after the handler has returned.
   *
   * When the handler returns successfully, we need to update the record in the
   * idempotency store to indicate that the execution has completed and
   * store its result.
   *
   * To avoid duplication of code, we expose this method so that it can be
   * called from the `after` phase of the Middy middleware.
   *
   * @param response The response returned by the handler.
   */
  public async handleMiddyAfter(response: unknown): Promise<void> {
    await this.#saveSuccessfullResult(response as ReturnType<Func>);
  }

  /**
   * Handle the idempotency operations needed after the handler has returned.
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
   * @param request The request object passed to the handler.
   * @param callback Callback function to cleanup pending middlewares when returning early.
   */
  public async handleMiddyBefore(
    request: MiddyLikeRequest,
    callback: (request: MiddyLikeRequest) => Promise<void>
  ): Promise<ReturnType<Func> | void> {
    for (let retryNo = 0; retryNo <= MAX_RETRIES; retryNo++) {
      try {
        const result = await this.#saveInProgressOrReturnExistingResult();
        if (result) {
          await callback(request);

          return result as ReturnType<Func>;
        }
        break;
      } catch (error) {
        if (
          error instanceof IdempotencyInconsistentStateError &&
          retryNo < MAX_RETRIES
        ) {
          // Retry
          continue;
        }
        // Retries exhausted or other error
        throw error;
      }
    }
  }

  /**
   * Handle the idempotency operations needed when an error is thrown in the handler.
   *
   * When an error is thrown in the handler, we need to delete the record from the
   * idempotency store.
   *
   * To avoid duplication of code, we expose this method so that it can be
   * called from the `onError` phase of the Middy middleware.
   */
  public async handleMiddyOnError(): Promise<void> {
    await this.#deleteInProgressRecord();
  }

  /**
   * Setter for the payload to be hashed to generate the idempotency key.
   *
   * This is useful if you want to use a different payload than the one
   * used to instantiate the `IdempotencyHandler`, for example when using
   * it within a Middy middleware.
   *
   * @param functionPayloadToBeHashed The payload to be hashed to generate the idempotency key
   */
  public setFunctionPayloadToBeHashed(
    functionPayloadToBeHashed: JSONValue
  ): void {
    this.#functionPayloadToBeHashed = functionPayloadToBeHashed;
  }

  /**
   * Avoid idempotency if the eventKeyJmesPath is not present in the payload and throwOnNoIdempotencyKey is false
   */
  public shouldSkipIdempotency(): boolean {
    if (!this.#idempotencyConfig.isEnabled()) return true;

    if (
      this.#idempotencyConfig.eventKeyJmesPath !== '' &&
      !this.#idempotencyConfig.throwOnNoIdempotencyKey
    ) {
      const selection = search(
        this.#idempotencyConfig.eventKeyJmesPath,
        this.#functionPayloadToBeHashed,
        { customFunctions: new PowertoolsFunctions() }
      );

      return selection === undefined || selection === null;
    } else {
      return false;
    }
  }

  /**
   * Delete an in progress record from the idempotency store.
   *
   * This is called when the handler throws an error.
   */
  #deleteInProgressRecord = async (): Promise<void> => {
    try {
      await this.#persistenceStore.deleteRecord(
        this.#functionPayloadToBeHashed
      );
    } catch (e) {
      throw new IdempotencyPersistenceLayerError(
        'Failed to delete record from idempotency store',
        e as Error
      );
    }
  };

  /**
   * Save an in progress record to the idempotency store or return an stored result.
   *
   * Before returning a result, we might neede to look up the idempotency record
   * and validate it to ensure that it is consistent with the payload to be hashed.
   */
  #saveInProgressOrReturnExistingResult =
    async (): Promise<JSONValue | void> => {
      try {
        await this.#persistenceStore.saveInProgress(
          this.#functionPayloadToBeHashed,
          this.#idempotencyConfig.lambdaContext?.getRemainingTimeInMillis()
        );
      } catch (e) {
        if (e instanceof IdempotencyItemAlreadyExistsError) {
          let idempotencyRecord = e.existingRecord;
          if (idempotencyRecord !== undefined) {
            // If the error includes the existing record, we can use it to validate
            // the record being processed and cache it in memory.
            idempotencyRecord = this.#persistenceStore.processExistingRecord(
              idempotencyRecord,
              this.#functionPayloadToBeHashed
            );
            // If the error doesn't include the existing record, we need to fetch
            // it from the persistence layer. In doing so, we also call the processExistingRecord
            // method to validate the record and cache it in memory.
          } else {
            idempotencyRecord = await this.#persistenceStore.getRecord(
              this.#functionPayloadToBeHashed
            );
          }

          return IdempotencyHandler.determineResultFromIdempotencyRecord(
            idempotencyRecord
          );
        } else {
          throw new IdempotencyPersistenceLayerError(
            'Failed to save in progress record to idempotency store',
            e as Error
          );
        }
      }
    };

  /**
   * Save a successful result to the idempotency store.
   *
   * This is called when the handler returns successfully.
   *
   * @param result The result returned by the handler.
   */
  #saveSuccessfullResult = async (result: ReturnType<Func>): Promise<void> => {
    try {
      await this.#persistenceStore.saveSuccess(
        this.#functionPayloadToBeHashed,
        result
      );
    } catch (e) {
      throw new IdempotencyPersistenceLayerError(
        'Failed to update success record to idempotency store',
        e as Error
      );
    }
  };
}

import type { JSONValue } from '@aws-lambda-powertools/commons';
import type { AnyFunction, IdempotencyHandlerOptions } from './types';
import { IdempotencyRecordStatus } from './types';
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from './errors';
import { BasePersistenceLayer, IdempotencyRecord } from './persistence';
import { IdempotencyConfig } from './IdempotencyConfig';
import { MAX_RETRIES } from './constants';
import { search } from 'jmespath';

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
  readonly #functionPayloadToBeHashed: JSONValue;
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

  public static determineResultFromIdempotencyRecord(
    idempotencyRecord: IdempotencyRecord
  ): Promise<unknown> | unknown {
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

  public async getFunctionResult(): Promise<ReturnType<Func>> {
    let result;
    try {
      result = await this.#functionToMakeIdempotent(...this.#functionArguments);
    } catch (e) {
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
      throw e;
    }
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

    return result;
  }

  /**
   * Main entry point for the handler
   *
   * In some rare cases, when the persistent state changes in small time
   * window, we might get an `IdempotencyInconsistentStateError`. In such
   * cases we can safely retry the handling a few times.
   */
  public async handle(): Promise<ReturnType<Func>> {
    let e;
    for (let retryNo = 0; retryNo <= MAX_RETRIES; retryNo++) {
      try {
        return await this.processIdempotency();
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

  public async processIdempotency(): Promise<ReturnType<Func>> {
    // early return if we should skip idempotency completely
    if (
      IdempotencyHandler.shouldSkipIdempotency(
        this.#idempotencyConfig.eventKeyJmesPath,
        this.#idempotencyConfig.throwOnNoIdempotencyKey,
        this.#functionPayloadToBeHashed
      )
    ) {
      return await this.#functionToMakeIdempotent(...this.#functionArguments);
    }

    try {
      await this.#persistenceStore.saveInProgress(
        this.#functionPayloadToBeHashed,
        this.#idempotencyConfig.lambdaContext?.getRemainingTimeInMillis()
      );
    } catch (e) {
      if (e instanceof IdempotencyItemAlreadyExistsError) {
        const idempotencyRecord: IdempotencyRecord =
          await this.#persistenceStore.getRecord(
            this.#functionPayloadToBeHashed
          );

        return IdempotencyHandler.determineResultFromIdempotencyRecord(
          idempotencyRecord
        ) as ReturnType<Func>;
      } else {
        throw new IdempotencyPersistenceLayerError(
          'Failed to save in progress record to idempotency store',
          e as Error
        );
      }
    }

    return this.getFunctionResult();
  }

  /**
   * avoid idempotency if the eventKeyJmesPath is not present in the payload and throwOnNoIdempotencyKey is false
   * static so {@link makeHandlerIdempotent} middleware can use it
   * TOOD: refactor so middy uses IdempotencyHandler internally wihtout reimplementing the logic
   * @param eventKeyJmesPath
   * @param throwOnNoIdempotencyKey
   * @param fullFunctionPayload
   * @private
   */
  public static shouldSkipIdempotency(
    eventKeyJmesPath: string,
    throwOnNoIdempotencyKey: boolean,
    fullFunctionPayload: JSONValue
  ): boolean {
    return (eventKeyJmesPath &&
      !throwOnNoIdempotencyKey &&
      !search(fullFunctionPayload, eventKeyJmesPath)) as boolean;
  }
}

import type { AnyFunctionWithRecord, IdempotencyHandlerOptions } from './types';
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
 */
export class IdempotencyHandler<U> {
  private readonly fullFunctionPayload: Record<string, unknown>;
  private readonly functionPayloadToBeHashed: Record<string, unknown>;
  private readonly functionToMakeIdempotent: AnyFunctionWithRecord<U>;
  private readonly idempotencyConfig: IdempotencyConfig;
  private readonly persistenceStore: BasePersistenceLayer;

  public constructor(options: IdempotencyHandlerOptions<U>) {
    const {
      functionToMakeIdempotent,
      functionPayloadToBeHashed,
      idempotencyConfig,
      fullFunctionPayload,
      persistenceStore,
    } = options;
    this.functionToMakeIdempotent = functionToMakeIdempotent;
    this.functionPayloadToBeHashed = functionPayloadToBeHashed;
    this.idempotencyConfig = idempotencyConfig;
    this.fullFunctionPayload = fullFunctionPayload;

    this.persistenceStore = persistenceStore;

    this.persistenceStore.configure({
      config: this.idempotencyConfig,
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

  public async getFunctionResult(): Promise<U> {
    let result: U;
    try {
      result = await this.functionToMakeIdempotent(this.fullFunctionPayload);
    } catch (e) {
      try {
        await this.persistenceStore.deleteRecord(
          this.functionPayloadToBeHashed
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
      await this.persistenceStore.saveSuccess(
        this.functionPayloadToBeHashed,
        result as Record<string, unknown>
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
  public async handle(): Promise<U> {
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

  public async processIdempotency(): Promise<U> {
    // early return if we should skip idempotency completely
    if (
      IdempotencyHandler.shouldSkipIdempotency(
        this.idempotencyConfig.eventKeyJmesPath,
        this.idempotencyConfig.throwOnNoIdempotencyKey,
        this.fullFunctionPayload
      )
    ) {
      return await this.functionToMakeIdempotent(this.fullFunctionPayload);
    }

    try {
      await this.persistenceStore.saveInProgress(
        this.functionPayloadToBeHashed,
        this.idempotencyConfig.lambdaContext?.getRemainingTimeInMillis()
      );
    } catch (e) {
      if (e instanceof IdempotencyItemAlreadyExistsError) {
        const idempotencyRecord: IdempotencyRecord =
          await this.persistenceStore.getRecord(this.functionPayloadToBeHashed);

        return IdempotencyHandler.determineResultFromIdempotencyRecord(
          idempotencyRecord
        ) as U;
      } else {
        throw new IdempotencyPersistenceLayerError(
          'Failed to save record in progress',
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
    fullFunctionPayload: Record<string, unknown>
  ): boolean {
    return (eventKeyJmesPath &&
      !throwOnNoIdempotencyKey &&
      !search(fullFunctionPayload, eventKeyJmesPath)) as boolean;
  }
}

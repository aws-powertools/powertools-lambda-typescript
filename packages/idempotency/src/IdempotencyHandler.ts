import type { AnyFunctionWithRecord, IdempotencyHandlerOptions } from './types';
import { IdempotencyRecordStatus } from './types';
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from './Exceptions';
import { BasePersistenceLayer, IdempotencyRecord } from './persistence';
import { IdempotencyConfig } from './IdempotencyConfig';

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
      persistenceStore
    } = options;
    this.functionToMakeIdempotent = functionToMakeIdempotent;
    this.functionPayloadToBeHashed = functionPayloadToBeHashed;
    this.idempotencyConfig = idempotencyConfig;
    this.fullFunctionPayload = fullFunctionPayload;

    this.persistenceStore = persistenceStore;

    this.persistenceStore.configure({
      config: this.idempotencyConfig
    });
  }

  public determineResultFromIdempotencyRecord(idempotencyRecord: IdempotencyRecord): Promise<U> | U {
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

    return idempotencyRecord.getResponse() as U;
  }

  public async getFunctionResult(): Promise<U> {
    let result: U;
    try {
      result = await this.functionToMakeIdempotent(this.fullFunctionPayload);

    } catch (e) {
      try {
        await this.persistenceStore.deleteRecord(this.functionPayloadToBeHashed);
      } catch (e) {
        throw new IdempotencyPersistenceLayerError('Failed to delete record from idempotency store');
      }
      throw e;
    }
    try {
      await this.persistenceStore.saveSuccess(this.functionPayloadToBeHashed, result as Record<string, unknown>);
    } catch (e) {
      throw new IdempotencyPersistenceLayerError('Failed to update success record to idempotency store');
    }

    return result;
  }

  /**
   * Main entry point for the handler
   * IdempotencyInconsistentStateError can happen under rare but expected cases
   * when persistent state changes in the small time between put & get requests.
   * In most cases we can retry successfully on this exception.
   */
  public async handle(): Promise<U> {

    const MAX_RETRIES = 2;
    for (let i = 1; i <= MAX_RETRIES; i++) {
      try {
        return await this.processIdempotency();
      } catch (e) {
        if (!(e instanceof IdempotencyAlreadyInProgressError) || i === MAX_RETRIES) {
          throw e;
        }
      }
    }
    /* istanbul ignore next */
    throw new Error('This should never happen');
  }

  public async processIdempotency(): Promise<U> {
    try {
      await this.persistenceStore.saveInProgress(
        this.functionPayloadToBeHashed,
      );
    } catch (e) {
      if (e instanceof IdempotencyItemAlreadyExistsError) {
        const idempotencyRecord: IdempotencyRecord =
          await this.persistenceStore.getRecord(
            this.functionPayloadToBeHashed
          );

        return this.determineResultFromIdempotencyRecord(idempotencyRecord);
      } else {
        throw new IdempotencyPersistenceLayerError();
      }
    }

    return this.getFunctionResult();
  }

}

import type { AnyFunctionWithRecord, IdempotencyOptions } from './types';
import { IdempotencyRecordStatus } from './types';
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from './Exceptions';
import { IdempotencyRecord } from './persistence';

export class IdempotencyHandler<U> {
  public constructor(
    private functionToMakeIdempotent: AnyFunctionWithRecord<U>,
    private functionPayloadToBeHashed: Record<string, unknown>,
    private idempotencyOptions: IdempotencyOptions,
    private fullFunctionPayload: Record<string, unknown>,
  ) {
  }

  public determineResultFromIdempotencyRecord(
    idempotencyRecord: IdempotencyRecord
  ): Promise<U> | U {
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
    } else {
      // Currently recalling the method as this fulfills FR1. FR3 will address using the previously stored value https://github.com/awslabs/aws-lambda-powertools-typescript/issues/447
      return this.functionToMakeIdempotent(this.fullFunctionPayload);
    }
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
      await this.idempotencyOptions.persistenceStore.saveInProgress(
        this.functionPayloadToBeHashed,
      );
    } catch (e) {
      if (e instanceof IdempotencyItemAlreadyExistsError) {
        const idempotencyRecord: IdempotencyRecord =
          await this.idempotencyOptions.persistenceStore.getRecord(
            this.functionPayloadToBeHashed
          );

        return this.determineResultFromIdempotencyRecord(idempotencyRecord);
      } else {
        throw new IdempotencyPersistenceLayerError();
      }
    }

    return this.functionToMakeIdempotent(this.fullFunctionPayload);
  }
}

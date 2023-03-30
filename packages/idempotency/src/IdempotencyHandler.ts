import { IdempotencyRecordStatus } from './types';
import type {
  AnyFunctionWithRecord,
  IdempotencyOptions,
} from './types';
import {
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyAlreadyInProgressError,
  IdempotencyPersistenceLayerError
} from './Exceptions';
import { IdempotencyRecord } from './persistence/IdempotencyRecord';

export class IdempotencyHandler<U> {
  public constructor(
    private functionToMakeIdempotent: AnyFunctionWithRecord<U>,
    private functionPayloadToBeHashed: Record<string, unknown>, 
    private idempotencyOptions: IdempotencyOptions,
    private fullFunctionPayload: Record<string, unknown>
  ) {}

  public determineResultFromIdempotencyRecord(idempotencyRecord: IdempotencyRecord): Promise<U> | U { 
    if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.EXPIRED) {
      throw new IdempotencyInconsistentStateError('Item has expired during processing and may not longer be valid.');
    } else if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.INPROGRESS){
      throw new IdempotencyAlreadyInProgressError(`There is already an execution in progress with idempotency key: ${idempotencyRecord.idempotencyKey}`);
    } else {
      // Currently recalling the method as this fulfills FR1. FR3 will address using the previously stored value https://github.com/awslabs/aws-lambda-powertools-typescript/issues/447
      return this.functionToMakeIdempotent(this.fullFunctionPayload); 
    }
  }

  public async processIdempotency(): Promise<U> {
    try {
      await this.idempotencyOptions.persistenceStore.saveInProgress(this.functionPayloadToBeHashed);
    } catch (e) {
      if (e instanceof IdempotencyItemAlreadyExistsError) {
        const idempotencyRecord: IdempotencyRecord = await this.idempotencyOptions.persistenceStore.getRecord(this.functionPayloadToBeHashed);

        return this.determineResultFromIdempotencyRecord(idempotencyRecord);
      } else {
        throw new IdempotencyPersistenceLayerError();
      }
    }

    return this.functionToMakeIdempotent(this.fullFunctionPayload);
  }
}
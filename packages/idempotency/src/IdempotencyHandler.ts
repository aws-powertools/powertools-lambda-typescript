/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyFunctionWithRecord, IdempotencyRecordStatus } from './types';
import { IdempotencyOptions } from './types/IdempotencyOptions';
import { IdempotencyRecord } from 'persistence';
import { IdempotencyInconsistentStateError, IdempotencyItemAlreadyExistsError, IdempotencyAlreadyInProgressError, IdempotencyPersistenceLayerError } from './Exceptions';

export class IdempotencyHandler<U> {

  public constructor(private functiontoMakeIdempotent: AnyFunctionWithRecord<U>, private functionPayloadToBeHashed: unknown, 
    private idempotencyOptions: IdempotencyOptions, private fullFunctionPayload: Record<string, any>) {}

  public determineResultFromIdempotencyRecord(idempotencyRecord: IdempotencyRecord): Promise<U> | U{ 
    if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.EXPIRED) {
      throw new IdempotencyInconsistentStateError();
    } else if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.INPROGRESS){
      throw new IdempotencyAlreadyInProgressError(`There is already an execution in progress with idempotency key: ${idempotencyRecord.idempotencyKey}`);
    } else {
      // Currently recalling the method as this fulfills FR1. FR3 will address using the previously stored value https://github.com/awslabs/aws-lambda-powertools-typescript/issues/447
      return this.functiontoMakeIdempotent(this.fullFunctionPayload); 
    }
  }

  public async process_idempotency(): Promise<U> {
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

    return this.functiontoMakeIdempotent(this.fullFunctionPayload);
  }
}
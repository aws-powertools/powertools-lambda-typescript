import { AnyFunction, IdempotencyRecordStatus } from './types';
import { IdempotencyOptions } from './IdempotencyOptions';
import { IdempotencyRecord, PersistenceLayerInterface } from 'persistence';
import { IdempotencyInconsistentStateError, IdempotencyItemAlreadyExistsError, IdempotencyAlreadyInProgressError, IdempotencyPersistenceLayerError } from './Exceptions';

export class IdempotencyHandler<U> {
  private persistenceLayer: PersistenceLayerInterface;

  public constructor(private functiontoMakeIdempotent: AnyFunction<U>, private functionPayload: unknown, 
    private idempotencyOptions: IdempotencyOptions, private args: Array<unknown>) {
    this.persistenceLayer = idempotencyOptions.persistenceStore;
  }

  public determineResultFromIdempotencyRecord(idempotencyRecord: IdempotencyRecord): Promise<U> | U{ //Would need to reduce this in the future to only be the promise
    if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.EXPIRED) {
      throw new IdempotencyInconsistentStateError();
    } else if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.INPROGRESS){
      throw new IdempotencyAlreadyInProgressError(`There is already an execution in progress with idempotency key: ${idempotencyRecord.idempotencyKey}`);
    } else {
      return this.functiontoMakeIdempotent(...this.args);
    }
  }

  public async process_idempotency(): Promise<U> {
    try {
      await this.persistenceLayer.saveInProgress(this.functionPayload);
    } catch (e) {
      if (e instanceof IdempotencyItemAlreadyExistsError) {
        const idempotencyRecord: IdempotencyRecord = await this.persistenceLayer.getRecord(this.functionPayload);

        return this.determineResultFromIdempotencyRecord(idempotencyRecord);
      } else {
        throw new IdempotencyPersistenceLayerError();
      }
    }

    return this.functiontoMakeIdempotent(...this.args);
  }
}
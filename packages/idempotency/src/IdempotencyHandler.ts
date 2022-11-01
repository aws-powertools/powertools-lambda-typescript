import { AnyFunction, IdempotencyRecordStatus } from './types';
import { IdempotencyOptions } from './IdempotencyOptions';
import { IdempotencyRecord, PersistenceLayerInterface } from 'persistence';
import { IdempotencyInconsistentStateError, IdempotencyItemAlreadyExistsError, IdempotencyAlreadyInProgressError } from 'Exceptions';

export class IdempotencyHandler {
//TODO: Think about making it so that all of the inputs considered are part of the "payload"
//Think about enforement: The payload must be JSON serializable
//TODO: promise returns vs synchronous

  private persistenceLayer: PersistenceLayerInterface;

  public constructor(private functiontoMakeIdempotent: AnyFunction<unknown>, private functionPayload: unknown, 
    private idempotencyOptions: IdempotencyOptions, private args: Array<unknown>) {
    this.persistenceLayer = idempotencyOptions.persistenceStore;
  }

  public determineResultFromIdempotencyRecord(idempotencyRecord: IdempotencyRecord): Record<string, unknown> | undefined {
    if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.EXPIRED) {
      throw new IdempotencyInconsistentStateError();
    } else if (idempotencyRecord.getStatus() === IdempotencyRecordStatus.INPROGRESS){
      throw new IdempotencyAlreadyInProgressError(`There is already an execution in progress with idempotency key: ${idempotencyRecord.idempotencyKey}`);
    } else {
      return idempotencyRecord.getResponse();
    }
  }

  public async process_idempotency(): Promise<unknown>{
    try {
      await this.persistenceLayer.saveInProgress(this.functionPayload);
    } catch (e) {
      if (e instanceof IdempotencyItemAlreadyExistsError) {
        const idempotencyRecord: IdempotencyRecord = await this.persistenceLayer.getRecord(this.functionPayload);

        return this.determineResultFromIdempotencyRecord(idempotencyRecord);
      }
    }

    return {};
  }
}
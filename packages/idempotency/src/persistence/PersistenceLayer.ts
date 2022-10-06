/* eslint-disable @typescript-eslint/no-empty-function */
import { createHash, Hash } from 'crypto';
import { IdempotencyRecordStatus } from 'types/IdempotencyRecordStatus';
import { EnvironmentVariablesService } from '../EnvironmentVariablesService';
import { IdempotencyRecord } from './IdempotencyRecord';
import { PersistenceLayerInterface } from './PersistenceLayerInterface';

abstract class PersistenceLayer implements PersistenceLayerInterface {

  // envVarsService is always initialized in the constructor
  private envVarsService!: EnvironmentVariablesService;

  private expiresAfterSeconds: number;

  private functionName: string = '';

  private hashFunction: Hash;

  public constructor() { 
    this.setEnvVarsService();
    this.expiresAfterSeconds = 60 * 60; //one hour is the default expiration
    this.hashFunction = createHash('md5');
        
  }
  public configure(functionName: string = ''): void {
    this.functionName = this.getEnvVarsService().getLambdaFunctionName + '.' + functionName;
  }

  public async deleteRecord(): Promise<void> { }
  public async getRecord(): Promise<IdempotencyRecord> {
    return Promise.resolve({} as IdempotencyRecord);
  }

  /**
   * Saves a record indicating that the function's execution is currently in progress
   * 
   * @param data - the data payload that will be hashed to create the hash portion of the idempotency key
   */
  public async saveInProgress(data: unknown): Promise<void> { 
    const idempotencyRecord: IdempotencyRecord = 
    new IdempotencyRecord(this.getHashedIdempotencyKey(JSON.stringify(data)),
      IdempotencyRecordStatus.INPROGRESS,
      this.getExpiryTimestamp(),
      undefined,
      undefined,
      undefined
    );

    return this._putRecord(idempotencyRecord);
  }
  public async saveSuccess(): Promise<void> { }

  protected abstract _deleteRecord(): Promise<void>;
  protected abstract _getRecord(): Promise<IdempotencyRecord>;
  protected abstract _putRecord(record: IdempotencyRecord): Promise<void>;
  protected abstract _updateRecord(record: IdempotencyRecord): Promise<void>;

  private generateHash(data: string): string{
    this.hashFunction.update(data);
    
    return this.hashFunction.digest('base64');
  }

  /**
   * Getter for `envVarsService`.
   * Used internally during initialization.
   */
  private getEnvVarsService(): EnvironmentVariablesService {
    return this.envVarsService;
  }

  private getExpiryTimestamp(): number {
    const currentTime: number = Date.now() / 1000;
    
    return currentTime + this.expiresAfterSeconds;
  }

  private getHashedIdempotencyKey(data: string): string {
    if (!data){
      console.warn('No data found for idempotency key');
    }
    
    return this.functionName + '#' + this.generateHash(data);
  }

  /**
   * Setter and initializer for `envVarsService`.
   * Used internally during initialization.
   */
  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

}

export {
  IdempotencyRecord,
  PersistenceLayer
};
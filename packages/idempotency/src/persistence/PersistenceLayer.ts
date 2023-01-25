import { BinaryToTextEncoding, createHash, Hash } from 'crypto';
import { IdempotencyRecordStatus } from '../types/IdempotencyRecordStatus';
import { EnvironmentVariablesService } from '../EnvironmentVariablesService';
import { IdempotencyRecord } from './IdempotencyRecord';
import { PersistenceLayerInterface } from './PersistenceLayerInterface';

abstract class PersistenceLayer implements PersistenceLayerInterface {

  // envVarsService is always initialized in the constructor
  private envVarsService!: EnvironmentVariablesService;

  private expiresAfterSeconds: number;

  private functionName: string = '';

  private hashDigest: BinaryToTextEncoding;

  private hashFunction: string;

  public constructor() { 
    this.setEnvVarsService();
    this.expiresAfterSeconds = 60 * 60; //one hour is the default expiration
    this.hashFunction = 'md5';
    this.hashDigest = 'base64';
        
  }
  public configure(functionName: string = ''): void {
    this.functionName = this.getEnvVarsService().getLambdaFunctionName() + '.' + functionName;
  }

  /**
   * Deletes a record from the persistence store for the persistence key generated from the data passed in.
   * 
   * @param data - the data payload that will be hashed to create the hash portion of the idempotency key
   */
  public async deleteRecord(data: unknown): Promise<void> { 
    const idempotencyRecord: IdempotencyRecord = new IdempotencyRecord({ 
      idempotencyKey: this.getHashedIdempotencyKey(data),
      status: IdempotencyRecordStatus.EXPIRED
    });
    
    this._deleteRecord(idempotencyRecord);
  }
  /**
   * Retrieves idempotency key for the provided data and fetches data for that key from the persistence store
   * 
   * @param data - the data payload that will be hashed to create the hash portion of the idempotency key
   */
  public async getRecord(data: unknown): Promise<IdempotencyRecord> {
    const idempotencyKey: string = this.getHashedIdempotencyKey(data);

    return this._getRecord(idempotencyKey);
  }

  /**
   * Saves a record indicating that the function's execution is currently in progress
   * 
   * @param data - the data payload that will be hashed to create the hash portion of the idempotency key
   */
  public async saveInProgress(data: unknown): Promise<void> { 
    const idempotencyRecord: IdempotencyRecord = 
    new IdempotencyRecord({
      idempotencyKey: this.getHashedIdempotencyKey(data),
      status: IdempotencyRecordStatus.INPROGRESS,
      expiryTimestamp: this.getExpiryTimestamp()
    });

    return this._putRecord(idempotencyRecord);
  }

  /**
   * Saves a record of the function completing successfully. This will create a record with a COMPLETED status
   * and will save the result of the completed function in the idempotency record.
   * 
   * @param data - the data payload that will be hashed to create the hash portion of the idempotency key
   * @param result - the result of the successfully completed function
   */
  public async saveSuccess(data: unknown, result: Record<string, unknown>): Promise<void> { 
    const idempotencyRecord: IdempotencyRecord = 
    new IdempotencyRecord({
      idempotencyKey: this.getHashedIdempotencyKey(data),
      status: IdempotencyRecordStatus.COMPLETED,
      expiryTimestamp: this.getExpiryTimestamp(),
      responseData: result
    });

    this._updateRecord(idempotencyRecord);

  }

  protected abstract _deleteRecord(record: IdempotencyRecord): Promise<void>;
  protected abstract _getRecord(idempotencyKey: string): Promise<IdempotencyRecord>;
  protected abstract _putRecord(record: IdempotencyRecord): Promise<void>;
  protected abstract _updateRecord(record: IdempotencyRecord): Promise<void>;

  /**
   * Generates a hash of the data and returns the digest of that hash
   * 
   * @param data the data payload that will generate the hash
   * @returns the digest of the generated hash
   */
  private generateHash(data: string): string{
    const hash: Hash = createHash(this.hashFunction);
    hash.update(data);
    
    return hash.digest(this.hashDigest);
  }

  /**
   * Getter for `envVarsService`.
   * Used internally during initialization.
   */
  private getEnvVarsService(): EnvironmentVariablesService {
    return this.envVarsService;
  }

  /**
   * Creates the expiry timestamp for the idempotency record
   * 
   * @returns the expiry time for the record expressed as number of seconds past the UNIX epoch
   */
  private getExpiryTimestamp(): number {
    const currentTime: number = Date.now() / 1000;
    
    return currentTime + this.expiresAfterSeconds;
  }

  /**
   * Generates the idempotency key used to identify records in the persistence store.
   * 
   * @param data the data payload that will be hashed to create the hash portion of the idempotency key
   * @returns the idempotency key
   */
  private getHashedIdempotencyKey(data: unknown): string {
    if (!data){
      console.warn('No data found for idempotency key');
    }
    
    return this.functionName + '#' + this.generateHash(JSON.stringify(data));
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
  PersistenceLayer
};
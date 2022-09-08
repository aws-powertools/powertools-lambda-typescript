/* eslint-disable @typescript-eslint/no-empty-function */
import { IdempotencyConfig } from '../IdempotencyConfig';
import { PersistenceLayerInterface } from './PersistenceLayerInterface';

abstract class PersistenceLayer implements PersistenceLayerInterface {
  public configure(_config: IdempotencyConfig): void {}
  public deleteRecord(): void {}
  public getRecord(): void {}
  public saveInProgress(): void {}
  public saveSuccess(): void {}

  protected abstract _deleteRecord(): void;
  protected abstract _getRecord(): void;
  protected abstract _putRecord(): void;
  protected abstract _updateRecord(): void;
}

export {
  PersistenceLayer
};
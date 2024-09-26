import { vi } from 'vitest';
import { BasePersistenceLayer } from '../../src/persistence/BasePersistenceLayer.js';
import { DynamoDBPersistenceLayer } from '../../src/persistence/DynamoDBPersistenceLayer.js';
import type { IdempotencyRecord } from '../../src/persistence/IdempotencyRecord.js';

/**
 * Dummy class to test the abstract class BasePersistenceLayer.
 *
 * This class is used in the unit tests.
 */
class PersistenceLayerTestClass extends BasePersistenceLayer {
  public _deleteRecord = vi.fn();
  public _getRecord = vi.fn();
  public _putRecord = vi.fn();
  public _updateRecord = vi.fn();
}

/**
 * Dummy class to test the abstract class DynamoDBPersistenceLayer.
 *
 * This class is used in the unit tests.
 */
class DynamoDBPersistenceLayerTestClass extends DynamoDBPersistenceLayer {
  public _deleteRecord(record: IdempotencyRecord): Promise<void> {
    return super._deleteRecord(record);
  }

  public _getRecord(idempotencyKey: string): Promise<IdempotencyRecord> {
    return super._getRecord(idempotencyKey);
  }

  public _putRecord(_record: IdempotencyRecord): Promise<void> {
    return super._putRecord(_record);
  }

  public _updateRecord(record: IdempotencyRecord): Promise<void> {
    return super._updateRecord(record);
  }
}

export { PersistenceLayerTestClass, DynamoDBPersistenceLayerTestClass };

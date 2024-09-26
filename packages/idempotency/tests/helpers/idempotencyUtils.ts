import { vi } from 'vitest';
import { BasePersistenceLayer } from '../../src/persistence/BasePersistenceLayer.js';

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

export { PersistenceLayerTestClass };

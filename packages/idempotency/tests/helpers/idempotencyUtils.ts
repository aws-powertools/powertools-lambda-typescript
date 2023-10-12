import { BasePersistenceLayer } from '../../src/persistence/BasePersistenceLayer.js';

/**
 * Dummy class to test the abstract class BasePersistenceLayer.
 *
 * This class is used in the unit tests.
 */
class PersistenceLayerTestClass extends BasePersistenceLayer {
  protected _deleteRecord = jest.fn();
  protected _getRecord = jest.fn();
  protected _putRecord = jest.fn();
  protected _updateRecord = jest.fn();
}

export { PersistenceLayerTestClass };

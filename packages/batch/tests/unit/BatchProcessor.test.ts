/**
 * Test BatchProcessor class
 *
 * @group unit/batch/class/batchprocessor
 */
import { BatchProcessor } from '../../src';

describe('Class: IdempotencyConfig', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('remove me', () => {
    test('does stuff', () => {
      expect(BatchProcessor).toBeDefined();
    });
  });
});

/**
 * Test Function Wrapper
 *
 * @group unit/idempotency/decorator
 */

import { BasePersistenceLayer, IdempotencyRecord } from '../../src/persistence';
import { idempotent } from '../../src/';
import type { IdempotencyRecordOptions } from '../../src/types';
import {
  IdempotencyAlreadyInProgressError,
  IdempotencyInconsistentStateError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyPersistenceLayerError,
} from '../../src/errors';
import { IdempotencyConfig } from '../../src';
import { Context } from 'aws-lambda';
import context from '@aws-lambda-powertools/testing-utils/context';
import { IdempotencyRecordStatus } from '../../src/constants';

const mockSaveInProgress = jest
  .spyOn(BasePersistenceLayer.prototype, 'saveInProgress')
  .mockImplementation();
const mockSaveSuccess = jest
  .spyOn(BasePersistenceLayer.prototype, 'saveSuccess')
  .mockImplementation();
const mockGetRecord = jest
  .spyOn(BasePersistenceLayer.prototype, 'getRecord')
  .mockImplementation();

const mockConfig: IdempotencyConfig = new IdempotencyConfig({});

class PersistenceLayerTestClass extends BasePersistenceLayer {
  protected _deleteRecord = jest.fn();
  protected _getRecord = jest.fn();
  protected _putRecord = jest.fn();
  protected _updateRecord = jest.fn();
}

const functionalityToDecorate = jest.fn();

class TestinClassWithLambdaHandler {
  @idempotent({
    persistenceStore: new PersistenceLayerTestClass(),
  })
  public testing(record: Record<string, unknown>, _context: Context): string {
    functionalityToDecorate(record);

    return 'Hi';
  }
}

class TestingClassWithFunctionDecorator {
  public handler(record: Record<string, unknown>, context: Context): string {
    mockConfig.registerLambdaContext(context);

    return this.proccessRecord(record, 'bar');
  }

  @idempotent({
    persistenceStore: new PersistenceLayerTestClass(),
    config: mockConfig,
    dataIndexArgument: 0,
  })
  public proccessRecord(record: Record<string, unknown>, _foo: string): string {
    functionalityToDecorate(record);

    return 'Processed Record';
  }
}

describe('Given a class with a function to decorate', (classWithLambdaHandler = new TestinClassWithLambdaHandler(), classWithFunctionDecorator = new TestingClassWithFunctionDecorator()) => {
  const keyValueToBeSaved = 'thisWillBeSaved';
  const inputRecord = {
    testingKey: keyValueToBeSaved,
    otherKey: 'thisWillNot',
  };
  beforeEach(() => jest.clearAllMocks());

  describe('When wrapping a function with no previous executions', () => {
    beforeEach(async () => {
      await classWithFunctionDecorator.handler(inputRecord, context);
    });

    test('Then it will save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(
        inputRecord,
        context.getRemainingTimeInMillis()
      );
    });

    test('Then it will call the function that was decorated', () => {
      expect(functionalityToDecorate).toBeCalledWith(inputRecord);
    });

    test('Then it will save the record to COMPLETED with function return value', () => {
      expect(mockSaveSuccess).toBeCalledWith(inputRecord, 'Processed Record');
    });
  });
  describe('When wrapping a handler function with no previous executions', () => {
    beforeEach(async () => {
      await classWithLambdaHandler.testing(inputRecord, context);
    });

    test('Then it will save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(
        inputRecord,
        context.getRemainingTimeInMillis()
      );
    });

    test('Then it will call the function that was decorated', () => {
      expect(functionalityToDecorate).toBeCalledWith(inputRecord);
    });

    test('Then it will save the record to COMPLETED with function return value', () => {
      expect(mockSaveSuccess).toBeCalledWith(inputRecord, 'Hi');
    });
  });

  describe('When decorating a function with previous execution that is INPROGRESS', () => {
    let resultingError: Error;
    beforeEach(async () => {
      mockSaveInProgress.mockRejectedValue(
        new IdempotencyItemAlreadyExistsError()
      );
      const idempotencyOptions: IdempotencyRecordOptions = {
        idempotencyKey: 'key',
        status: IdempotencyRecordStatus.INPROGRESS,
      };
      mockGetRecord.mockResolvedValue(
        new IdempotencyRecord(idempotencyOptions)
      );
      try {
        await classWithLambdaHandler.testing(inputRecord, context);
      } catch (e) {
        resultingError = e as Error;
      }
    });

    test('Then it will attempt to save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(
        inputRecord,
        context.getRemainingTimeInMillis()
      );
    });

    test('Then it will get the previous execution record', () => {
      expect(mockGetRecord).toBeCalledWith(inputRecord);
    });

    test('Then it will not call the function that was decorated', () => {
      expect(functionalityToDecorate).not.toBeCalled();
    });

    test('Then an IdempotencyAlreadyInProgressError is thrown', () => {
      expect(resultingError).toBeInstanceOf(IdempotencyAlreadyInProgressError);
    });
  });

  describe('When decorating a function with previous execution that is EXPIRED', () => {
    let resultingError: Error;
    beforeEach(async () => {
      mockSaveInProgress.mockRejectedValue(
        new IdempotencyItemAlreadyExistsError()
      );
      const idempotencyOptions: IdempotencyRecordOptions = {
        idempotencyKey: 'key',
        status: IdempotencyRecordStatus.EXPIRED,
      };
      mockGetRecord.mockResolvedValue(
        new IdempotencyRecord(idempotencyOptions)
      );
      try {
        await classWithLambdaHandler.testing(inputRecord, context);
      } catch (e) {
        resultingError = e as Error;
      }
    });

    test('Then it will attempt to save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(
        inputRecord,
        context.getRemainingTimeInMillis()
      );
    });

    test('Then it will get the previous execution record', () => {
      expect(mockGetRecord).toBeCalledWith(inputRecord);
    });

    test('Then it will not call the function that was decorated', () => {
      expect(functionalityToDecorate).not.toBeCalled();
    });

    test('Then an IdempotencyInconsistentStateError is thrown', () => {
      expect(resultingError).toBeInstanceOf(IdempotencyInconsistentStateError);
    });
  });

  describe('When wrapping a function with previous execution that is COMPLETED', () => {
    beforeEach(async () => {
      mockSaveInProgress.mockRejectedValue(
        new IdempotencyItemAlreadyExistsError()
      );
      const idempotencyOptions: IdempotencyRecordOptions = {
        idempotencyKey: 'key',
        status: IdempotencyRecordStatus.COMPLETED,
        responseData: 'Hi',
      };

      mockGetRecord.mockResolvedValue(
        new IdempotencyRecord(idempotencyOptions)
      );
      await classWithLambdaHandler.testing(inputRecord, context);
    });

    test('Then it will attempt to save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(
        inputRecord,
        context.getRemainingTimeInMillis()
      );
    });

    test('Then it will get the previous execution record', () => {
      expect(mockGetRecord).toBeCalledWith(inputRecord);
    });

    test('Then it will not call decorated functionality', () => {
      expect(functionalityToDecorate).not.toBeCalledWith(inputRecord);
    });
  });

  describe('When wrapping a function with issues saving the record', () => {
    class TestinClassWithLambdaHandlerWithConfig {
      @idempotent({
        persistenceStore: new PersistenceLayerTestClass(),
        config: new IdempotencyConfig({ lambdaContext: context }),
      })
      public testing(record: Record<string, unknown>): string {
        functionalityToDecorate(record);

        return 'Hi';
      }
    }

    let resultingError: Error;
    beforeEach(async () => {
      mockSaveInProgress.mockRejectedValue(new Error('RandomError'));
      const classWithLambdaHandlerWithConfig =
        new TestinClassWithLambdaHandlerWithConfig();
      try {
        await classWithLambdaHandlerWithConfig.testing(inputRecord);
      } catch (e) {
        resultingError = e as Error;
      }
    });

    test('Then it will attempt to save the record to INPROGRESS', () => {
      expect(mockSaveInProgress).toBeCalledWith(
        inputRecord,
        context.getRemainingTimeInMillis()
      );
    });

    test('Then an IdempotencyPersistenceLayerError is thrown', () => {
      expect(resultingError).toBeInstanceOf(IdempotencyPersistenceLayerError);
    });
  });

  describe('When idempotency is disabled', () => {
    beforeAll(async () => {
      process.env.POWERTOOLS_IDEMPOTENCY_DISABLED = 'true';
      class TestingClassWithIdempotencyDisabled {
        @idempotent({
          persistenceStore: new PersistenceLayerTestClass(),
          config: new IdempotencyConfig({ lambdaContext: context }),
        })
        public testing(
          record: Record<string, unknown>,
          _context: Context
        ): string {
          functionalityToDecorate(record);

          return 'Hi';
        }
      }
      const classWithoutIdempotencyDisabled =
        new TestingClassWithIdempotencyDisabled();
      await classWithoutIdempotencyDisabled.testing(inputRecord, context);
    });

    test('Then it will skip ipdemotency', async () => {
      expect(mockSaveInProgress).not.toBeCalled();
      expect(mockSaveSuccess).not.toBeCalled();
    });

    afterAll(() => {
      delete process.env.POWERTOOLS_IDEMPOTENCY_DISABLED;
    });
  });
});

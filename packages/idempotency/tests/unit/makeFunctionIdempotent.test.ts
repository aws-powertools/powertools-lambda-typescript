/**
 * Test Function Wrapper
 *
 * @group unit/idempotency/makeFunctionIdempotent
 */
import { IdempotencyOptions } from '../../src/types/IdempotencyOptions';
import { IdempotencyRecord, BasePersistenceLayer } from '../../src/persistence';
import { makeFunctionIdempotent } from '../../src/makeFunctionIdempotent';
import { IdempotencyRecordStatus } from '../../src/types';
import type {
  AnyIdempotentFunction,
  IdempotencyRecordOptions
} from '../../src/types';
import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyAlreadyInProgressError,
  IdempotencyInconsistentStateError,
  IdempotencyPersistenceLayerError
} from '../../src/Exceptions';

const mockSaveInProgress = jest.spyOn(BasePersistenceLayer.prototype, 'saveInProgress').mockImplementation();
const mockGetRecord = jest.spyOn(BasePersistenceLayer.prototype, 'getRecord').mockImplementation();

class PersistenceLayerTestClass extends BasePersistenceLayer {
  protected _deleteRecord = jest.fn();
  protected _getRecord = jest.fn();
  protected _putRecord = jest.fn();
  protected _updateRecord = jest.fn();
}

describe('Given a function to wrap', (functionToWrap = jest.fn()) => {
  beforeEach(()=> jest.clearAllMocks());
  describe('Given options for idempotency', (options: IdempotencyOptions = { persistenceStore: new PersistenceLayerTestClass(), dataKeywordArgument: 'testingKey' }) => {
    const keyValueToBeSaved = 'thisWillBeSaved';
    const inputRecord = { testingKey: keyValueToBeSaved, otherKey: 'thisWillNot' };
    describe('When wrapping a function with no previous executions', () => {
      let resultingFunction: AnyIdempotentFunction<string>;
      beforeEach(async () => {
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        await resultingFunction(inputRecord);
      });

      test('Then it will save the record to INPROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
      });

      test('Then it will call the function that was wrapped with the whole input record', () => {
        expect(functionToWrap).toBeCalledWith(inputRecord);
      });
    });

    describe('When wrapping a function with previous execution that is INPROGRESS', () => {
      let resultingFunction: AnyIdempotentFunction<string>;
      let resultingError: Error;
      beforeEach(async () => {
        mockSaveInProgress.mockRejectedValue(new IdempotencyItemAlreadyExistsError());
        const idempotencyOptions: IdempotencyRecordOptions = {
          idempotencyKey: 'key',
          status: IdempotencyRecordStatus.INPROGRESS
        };
        mockGetRecord.mockResolvedValue(new IdempotencyRecord(idempotencyOptions));
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        try {
          await resultingFunction(inputRecord);
        } catch (e) {
          resultingError = e as Error;
        }
      });
  
      test('Then it will attempt to save the record to INPROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
      });
  
      test('Then it will get the previous execution record', () => {
        expect(mockGetRecord).toBeCalledWith(keyValueToBeSaved);
      });

      test('Then the function that was wrapped is not called again', () => {
        expect(functionToWrap).not.toBeCalled();
      });

      test('Then an IdempotencyAlreadyInProgressError is thrown', ()=> {
        expect(resultingError).toBeInstanceOf(IdempotencyAlreadyInProgressError);
      });
    });

    describe('When wrapping a function with previous execution that is EXPIRED', () => {
      let resultingFunction: AnyIdempotentFunction<string>;
      let resultingError: Error;
      beforeEach(async () => {
        mockSaveInProgress.mockRejectedValue(new IdempotencyItemAlreadyExistsError());
        const idempotencyOptions: IdempotencyRecordOptions = {
          idempotencyKey: 'key',
          status: IdempotencyRecordStatus.EXPIRED
        };
        mockGetRecord.mockResolvedValue(new IdempotencyRecord(idempotencyOptions));
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        try {
          await resultingFunction(inputRecord);
        } catch (e) {
          resultingError = e as Error;
        }
      });
    
      test('Then it will attempt to save the record to INPROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
      });
    
      test('Then it will get the previous execution record', () => {
        expect(mockGetRecord).toBeCalledWith(keyValueToBeSaved);
      });

      test('Then the function that was wrapped is not called again', () => {
        expect(functionToWrap).not.toBeCalled();
      });
  
      test('Then an IdempotencyInconsistentStateError is thrown', ()=> {
        expect(resultingError).toBeInstanceOf(IdempotencyInconsistentStateError);
      });
    });

    describe('When wrapping a function with previous execution that is COMPLETED', () => {
      let resultingFunction: AnyIdempotentFunction<string>;
      beforeEach(async () => {
        mockSaveInProgress.mockRejectedValue(new IdempotencyItemAlreadyExistsError());
        const idempotencyOptions: IdempotencyRecordOptions = {
          idempotencyKey: 'key',
          status: IdempotencyRecordStatus.COMPLETED
        };
        mockGetRecord.mockResolvedValue(new IdempotencyRecord(idempotencyOptions)); 
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        await resultingFunction(inputRecord);
      });
    
      test('Then it will attempt to save the record to INPROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
      });
    
      test('Then it will get the previous execution record', () => {
        expect(mockGetRecord).toBeCalledWith(keyValueToBeSaved);
      });

      //This should be the saved record once FR3 is complete https://github.com/awslabs/aws-lambda-powertools-typescript/issues/447
      test('Then it will call the function that was wrapped with the whole input record', () => {
        expect(functionToWrap).toBeCalledWith(inputRecord);
      });
    });

    describe('When wrapping a function with issues saving the record', () => {
      let resultingFunction: AnyIdempotentFunction<string>;
      let resultingError: Error;
      beforeEach(async () => {
        mockSaveInProgress.mockRejectedValue(new Error('RandomError'));
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        try {
          await resultingFunction(inputRecord);
        } catch (e) {
          resultingError = e as Error;
        }
      });
      
      test('Then it will attempt to save the record to INPROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith(keyValueToBeSaved);
      });
    
      test('Then an IdempotencyPersistenceLayerError is thrown', ()=> {
        expect(resultingError).toBeInstanceOf(IdempotencyPersistenceLayerError);
      });
    });
  });
});
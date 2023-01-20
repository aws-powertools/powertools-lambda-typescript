/**
 * Test Function Wrapper
 *
 * @group unit/idempotency/all
 */

import { IdempotencyOptions } from '../../src/IdempotencyOptions';
import { IdempotencyRecord, PersistenceLayer } from '../../src/persistence';
import { makeFunctionIdempotent } from '../../src/makeFunctionIdempotent';
import { AnyIdempotentFunction, IdempotencyRecordStatus } from '../../src/types';
import { IdempotencyItemAlreadyExistsError, IdempotencyAlreadyInProgressError, IdempotencyInconsistentStateError, IdempotencyPersistenceLayerError } from '../../src/Exceptions';
// jest.mock('../../src/persistence');
const mockSaveInProgress = jest.spyOn(PersistenceLayer.prototype, 'saveInProgress').mockImplementation();
const mockGetRecord = jest.spyOn(PersistenceLayer.prototype, 'getRecord').mockImplementation();

const deleteRecord = jest.fn();
const getRecord = jest.fn();
const putRecord = jest.fn();
const updateRecord = jest.fn();

class PersistenceLayerTestClass extends PersistenceLayer {
  protected _deleteRecord = deleteRecord;
  protected _getRecord = getRecord;
  protected _putRecord = putRecord;
  protected _updateRecord = updateRecord;
}

describe('Given a function to wrap', (functionToWrap = jest.fn()) => {
  describe('Given options for idempotency', (options: IdempotencyOptions = { persistenceStore: new PersistenceLayerTestClass(), dataKeywordArgument: 'testingKey' }) => {
    const inputRecord = { testingKey: 'thisWillBeSaved', otherKey: 'thisWillNot' };
    describe('When wrapping a function with no previous executions', () => {
      let resultingFunction: AnyIdempotentFunction<string>;
      beforeEach(async () => {
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        await resultingFunction(inputRecord);
      });

      test('Then it will save the record to IN_PROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith('thisWillBeSaved');
      });

      test('Then it will call the function that was wrapped with the whole input record', () => {
        expect(functionToWrap).toBeCalledWith(inputRecord);
      });
    });

    describe('When wrapping a function with previous execution that is IN_PROGRESS', () => {
      let resultingFunction: AnyIdempotentFunction<string>;
      let resultingError: Error;
      beforeEach(async () => {
        mockSaveInProgress.mockRejectedValue(new IdempotencyItemAlreadyExistsError());
        mockGetRecord.mockResolvedValue(new IdempotencyRecord('key', IdempotencyRecordStatus.INPROGRESS, undefined, undefined, undefined, undefined));
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        try {
          await resultingFunction(inputRecord);
        } catch (e) {
          resultingError = e as Error;
        }
      });
  
      test('Then it will attempt to save the record to IN_PROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith('thisWillBeSaved');
      });
  
      test('Then it will get the previous execution record', () => {
        expect(mockGetRecord).toBeCalledWith('thisWillBeSaved');
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
        mockGetRecord.mockResolvedValue(new IdempotencyRecord('key', IdempotencyRecordStatus.EXPIRED, undefined, undefined, undefined, undefined));
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        try {
          await resultingFunction(inputRecord);
        } catch (e) {
          resultingError = e as Error;
        }
      });
    
      test('Then it will attempt to save the record to IN_PROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith('thisWillBeSaved');
      });
    
      test('Then it will get the previous execution record', () => {
        expect(mockGetRecord).toBeCalledWith('thisWillBeSaved');
      });
  
      test('Then an IdempotencyInconsistentStateError is thrown', ()=> {
        expect(resultingError).toBeInstanceOf(IdempotencyInconsistentStateError);
      });
    });

    describe('When wrapping a function with previous execution that is COMPLETED', () => {
      let resultingFunction: AnyIdempotentFunction<string>;
      beforeEach(async () => {
        mockSaveInProgress.mockRejectedValue(new IdempotencyItemAlreadyExistsError());
        mockGetRecord.mockResolvedValue(new IdempotencyRecord('key', IdempotencyRecordStatus.COMPLETED, undefined, undefined, undefined, undefined));
        resultingFunction = makeFunctionIdempotent(functionToWrap, options);
        await resultingFunction(inputRecord);
      });
    
      test('Then it will attempt to save the record to IN_PROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith('thisWillBeSaved');
      });
    
      test('Then it will get the previous execution record', () => {
        expect(mockGetRecord).toBeCalledWith('thisWillBeSaved');
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
      
      test('Then it will attempt to save the record to IN_PROGRESS', () => {
        expect(mockSaveInProgress).toBeCalledWith('thisWillBeSaved');
      });
    
      test('Then an IdempotencyPersistenceLayerError is thrown', ()=> {
        expect(resultingError).toBeInstanceOf(IdempotencyPersistenceLayerError);
      });
    });
  });
});
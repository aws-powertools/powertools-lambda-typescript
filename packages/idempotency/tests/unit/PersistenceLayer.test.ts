/**
 * Test Tracer class
 *
 * @group unit/idempotency/all
 */
import { createHash, Hash } from 'crypto';
import { EnvironmentVariablesService } from '../../src/EnvironmentVariablesService';
import { IdempotencyRecord, PersistenceLayer } from '../../src/persistence';
import { IdempotencyRecordStatus } from '../../src/types/IdempotencyRecordStatus';

jest.mock('crypto', () => ({
  createHash: jest.fn(),
}));

const cryptoUpdateMock = jest.fn();
const cryptoDigestMock = jest.fn();

describe('Class: Persistence Layer', ()=> {

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

  describe('Method: saveInProgress', ()=> {
    const mockDigest = 'hashDigest';
    beforeEach(()=> {
      putRecord.mockClear();
      (createHash as jest.MockedFunction<typeof createHash>).mockReturnValue(
        {
          update: cryptoUpdateMock,
          digest: cryptoDigestMock.mockReturnValue(mockDigest)
        } as unknown as Hash
      );
    });

    test('When called it saves an IN_PROGRESS idempotency record', async ()=> {
      const data = 'someData';
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();

      await persistenceLayer.saveInProgress(data);

      const savedIdempotencyRecord: IdempotencyRecord = putRecord.mock.calls[0][0];
      expect(savedIdempotencyRecord.getStatus()).toBe(IdempotencyRecordStatus.INPROGRESS);   
    });

    test('When called it creates an idempotency key from the function name and a digest of the md5 hash of the data', async ()=> {
      const data = 'someData';
      const lambdaFunctionName = 'LambdaName';
      jest.spyOn(EnvironmentVariablesService.prototype, 'getLambdaFunctionName').mockReturnValue(lambdaFunctionName);

      const functionName = 'functionName';

      const expectedIdempotencyKey = lambdaFunctionName + '.' + functionName + '#' + mockDigest;
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure(functionName);

      await persistenceLayer.saveInProgress(data);

      const savedIdempotencyRecord: IdempotencyRecord = putRecord.mock.calls[0][0];

      expect(createHash).toHaveBeenCalledWith(
        expect.stringMatching('md5'),
      );
      expect(cryptoUpdateMock).toHaveBeenCalledWith(expect.stringMatching(data));
      expect(cryptoDigestMock).toHaveBeenCalledWith(
        expect.stringMatching('base64')
      );
      expect(savedIdempotencyRecord.idempotencyKey).toEqual(expectedIdempotencyKey);
    });

    test('When called it sets the expiry timestamp to one hour in the future', async ()=> {
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      const data = 'someData';
      const currentMillisTime = 3000;
      const currentSeconds = currentMillisTime / 1000;
      const oneHourSeconds = 60 * 60;
      jest.spyOn(Date, 'now').mockReturnValue(currentMillisTime);

      await persistenceLayer.saveInProgress(data);
    
      const savedIdempotencyRecord: IdempotencyRecord = putRecord.mock.calls[0][0];
      expect(savedIdempotencyRecord.expiryTimestamp).toEqual(currentSeconds + oneHourSeconds);

    });

    test('When called without data it logs a warning', async ()=> {
      const consoleSpy = jest.spyOn(console, 'warn');
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();

      await persistenceLayer.saveInProgress('');
      expect(consoleSpy).toHaveBeenCalled();
    });

  });
});
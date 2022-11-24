/**
 * Test PersistenceLayer class
 *
 * @group unit/idempotency/all
 */
import { createHash, Hash } from 'crypto';
import { IdempotencyRecord, PersistenceLayer } from '../../../src/persistence';
import { IdempotencyRecordStatus } from '../../../src/types/IdempotencyRecordStatus';

jest.mock('crypto', () => ({
  createHash: jest.fn(),
}));

const cryptoUpdateMock = jest.fn();
const cryptoDigestMock = jest.fn();
const mockDigest = 'hashDigest';

describe('Class: PersistenceLayer', () => {

  const dummyData = 'someData';
  const idempotentFunctionName = 'foo';

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

  describe('Method: configure', () => {

    test('when called without options it maintains the default value for the key prefix', () => {

      // Prepare
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure();

      expect(persistenceLayer).toEqual(expect.objectContaining({
        idempotencyKeyPrefix: process.env.AWS_LAMBDA_FUNCTION_NAME,
      }));

    });

    test('when called with an empty option object it maintains the default value for the key prefix', () => {

      // Prepare
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({});

      expect(persistenceLayer).toEqual(expect.objectContaining({
        idempotencyKeyPrefix: process.env.AWS_LAMBDA_FUNCTION_NAME,
      }));

    });

    test('when called with an empty string as functionName it maintains the default value for the key prefix', () => {

      // Prepare
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({ functionName: '' });

      expect(persistenceLayer).toEqual(expect.objectContaining({
        idempotencyKeyPrefix: process.env.AWS_LAMBDA_FUNCTION_NAME,
      }));

    });

    test('when called with a valid functionName it concatenates the key prefix correctly', () => {

      // Prepare
      const expectedIdempotencyKeyPrefix = `${process.env.AWS_LAMBDA_FUNCTION_NAME}.${idempotentFunctionName}`;
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({ functionName: idempotentFunctionName });

      expect(persistenceLayer).toEqual(expect.objectContaining({
        idempotencyKeyPrefix: expectedIdempotencyKeyPrefix
      }));

    });

  });

  describe('Method: saveInProgress', () => {

    beforeEach(() => {
      putRecord.mockClear();
      (createHash as jest.MockedFunction<typeof createHash>).mockReturnValue(
        {
          update: cryptoUpdateMock,
          digest: cryptoDigestMock.mockReturnValue(mockDigest)
        } as unknown as Hash
      );

    });

    test('when called, it saves an IN_PROGRESS idempotency record via _putRecord()', async () => {

      // Prepare
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();

      // Act
      await persistenceLayer.saveInProgress(dummyData);

      // Assess
      const savedIdempotencyRecord: IdempotencyRecord = putRecord.mock.calls[0][0];
      expect(savedIdempotencyRecord.getStatus()).toBe(IdempotencyRecordStatus.INPROGRESS);   

    });

    test('when called, it creates an idempotency key from the function name and a digest of the md5 hash of the data', async () => {
      
      // Prepare
      const expectedIdempotencyKey = `${process.env.AWS_LAMBDA_FUNCTION_NAME}.${idempotentFunctionName}#${mockDigest}`;
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({ functionName: idempotentFunctionName });

      // Act
      await persistenceLayer.saveInProgress(dummyData);

      // Assess
      const savedIdempotencyRecord: IdempotencyRecord = putRecord.mock.calls[0][0];
      expect(createHash).toHaveBeenCalledWith(
        expect.stringMatching('md5'),
      );
      expect(cryptoUpdateMock).toHaveBeenCalledWith(expect.stringMatching(dummyData));
      expect(cryptoDigestMock).toHaveBeenCalledWith(
        expect.stringMatching('base64')
      );
      expect(savedIdempotencyRecord.idempotencyKey).toEqual(expectedIdempotencyKey);

    });

    test('when called, it sets the expiry timestamp to one hour in the future', async () => {

      // Prepare
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      const currentMillisTime = 3000;
      const currentSeconds = currentMillisTime / 1000;
      const oneHourSeconds = 60 * 60;
      jest.spyOn(Date, 'now').mockReturnValue(currentMillisTime);

      // Act
      await persistenceLayer.saveInProgress(dummyData);
    
      // Assess
      const savedIdempotencyRecord: IdempotencyRecord = putRecord.mock.calls[0][0];
      expect(savedIdempotencyRecord.expiryTimestamp).toEqual(currentSeconds + oneHourSeconds);

    });

    test('when called without data, it logs a warning', async () => {

      // Prepare
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => ({}));
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();

      // Act
      await persistenceLayer.saveInProgress('');
      
      // Assess
      expect(consoleSpy).toHaveBeenCalled();

    });

  });

  describe('Method: saveSuccess', () => {

    beforeEach(() => {
      updateRecord.mockClear();
      (createHash as jest.MockedFunction<typeof createHash>).mockReturnValue(
        {
          update: cryptoUpdateMock,
          digest: cryptoDigestMock
        } as unknown as Hash
      );
    });

    test('when called, it updates the idempotency record status to COMPLETED', async () => {

      // Prepare
      const result = {};
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();

      // Act
      await persistenceLayer.saveSuccess(dummyData, result);

      // Assess
      const savedIdempotencyRecord: IdempotencyRecord = updateRecord.mock.calls[0][0];
      expect(savedIdempotencyRecord.getStatus()).toBe(IdempotencyRecordStatus.COMPLETED);

    });

    test('when called, it generates the idempotency key from the function name and a digest of the md5 hash of the data', async () => {

      // Prepare
      const result = {};
      const expectedIdempotencyKey = `${process.env.AWS_LAMBDA_FUNCTION_NAME}.${idempotentFunctionName}#${mockDigest}`;
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      persistenceLayer.configure({ functionName: idempotentFunctionName });

      // Act
      await persistenceLayer.saveSuccess(dummyData, result);

      // Assess
      const savedIdempotencyRecord: IdempotencyRecord = updateRecord.mock.calls[0][0];
      expect(createHash).toHaveBeenCalledWith(
        expect.stringMatching('md5'),
      );
      expect(cryptoUpdateMock).toHaveBeenCalledWith(expect.stringMatching(dummyData));
      expect(cryptoDigestMock).toHaveBeenCalledWith(
        expect.stringMatching('base64')
      );
      expect(savedIdempotencyRecord.idempotencyKey).toEqual(expectedIdempotencyKey);

    });

    test('when called, it sets the expiry timestamp to one hour in the future', async () => {

      // Prepare
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      const result = {};
      const currentMillisTime = 3000;
      const currentSeconds = currentMillisTime / 1000;
      const oneHourSeconds = 60 * 60;
      jest.spyOn(Date, 'now').mockReturnValue(currentMillisTime);

      // Act
      await persistenceLayer.saveSuccess(dummyData, result);
    
      // Assess
      const savedIdempotencyRecord: IdempotencyRecord = updateRecord.mock.calls[0][0];
      expect(savedIdempotencyRecord.expiryTimestamp).toEqual(currentSeconds + oneHourSeconds);

    });

  });

  describe('Method: getRecord', () => {

    beforeEach(() => {
      putRecord.mockClear();
      (createHash as jest.MockedFunction<typeof createHash>).mockReturnValue(
        {
          update: cryptoUpdateMock,
          digest: cryptoDigestMock.mockReturnValue(mockDigest)
        } as unknown as Hash
      );
    });

    test('when called, it gets the record for the idempotency key for the data passed in', () => {

      // Prepare
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      const expectedIdempotencyKey = `${process.env.AWS_LAMBDA_FUNCTION_NAME}.${idempotentFunctionName}#${mockDigest}`;
      persistenceLayer.configure({ functionName: idempotentFunctionName });

      // Act
      persistenceLayer.getRecord(dummyData);

      // Assess
      expect(getRecord).toHaveBeenCalledWith(expectedIdempotencyKey);

    });
  });

  describe('Method: deleteRecord', () => {

    beforeEach(() => {
      putRecord.mockClear();
      (createHash as jest.MockedFunction<typeof createHash>).mockReturnValue(
        {
          update: cryptoUpdateMock,
          digest: cryptoDigestMock.mockReturnValue(mockDigest)
        } as unknown as Hash
      );
    });

    test('when called, it deletes the record with the idempotency key for the data passed in', () => {

      // Prepare
      const persistenceLayer: PersistenceLayer = new PersistenceLayerTestClass();
      const expectedIdempotencyKey = `${process.env.AWS_LAMBDA_FUNCTION_NAME}.${idempotentFunctionName}#${mockDigest}`;
      persistenceLayer.configure({ functionName: idempotentFunctionName });

      // Act
      persistenceLayer.deleteRecord(dummyData);
      
      // Assess
      const deletedIdempotencyRecord: IdempotencyRecord = deleteRecord.mock.calls[0][0];
      expect(deletedIdempotencyRecord.idempotencyKey).toEqual(expectedIdempotencyKey);

    });
  });
});
import { IdempotencyRecord } from '../../../src/persistence/IdempotencyRecord';
import { IdempotencyRecordStatus } from '../../../src/types/IdempotencyRecordStatus';
/**
 * Test Idempotency Record
 *
 * @group unit/idempotency/all
 */
const mockIdempotencyKey = '123';
const mockData = undefined;
const mockInProgressExpiry = 123;
const mockPayloadHash = '123';

describe('Given an idempotency record that is expired', () => {
  let idempotencyRecord: IdempotencyRecord;
  beforeEach(() => {
    const mockNowAfterExiryTime = 1487076708000;
    const expiryTimeBeforeNow = 1487076707000;
    Date.now = jest.fn(() => mockNowAfterExiryTime);
    idempotencyRecord = new IdempotencyRecord(mockIdempotencyKey, IdempotencyRecordStatus.INPROGRESS, expiryTimeBeforeNow, mockInProgressExpiry, mockData, mockPayloadHash);
  });
  describe('When checking the status of the idempotency record', () => {
    let resultingStatus: IdempotencyRecordStatus;
    beforeEach(() => {
      resultingStatus = idempotencyRecord.getStatus();
    });

    test('Then the status is EXPIRED', () => {
      expect(resultingStatus).toEqual(IdempotencyRecordStatus.EXPIRED); 
    });
  });
});

describe('Given an idempotency record that is not expired', () => {
  let idempotencyRecord: IdempotencyRecord; 
  beforeEach(() => {
    const mockNowBeforeExiryTime = 1487076707000;
    const expiryTimeAfterNow = 1487076708000;
    Date.now = jest.fn(() => mockNowBeforeExiryTime);
    idempotencyRecord = new IdempotencyRecord(mockIdempotencyKey, IdempotencyRecordStatus.INPROGRESS, expiryTimeAfterNow, mockInProgressExpiry, mockData, mockPayloadHash);
  });
  describe('When checking the status of the idempotency record', () => {
    let resultingStatus: IdempotencyRecordStatus;
    beforeEach(() => {
      resultingStatus = idempotencyRecord.getStatus();
    });
  
    test('Then the status is EXPIRED', () => {
      expect(resultingStatus).toEqual(IdempotencyRecordStatus.INPROGRESS); 
    });
  });
});
  

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  IdempotencyInvalidStatusError,
  IdempotencyRecordStatus,
} from '../../../src/index.js';
import { IdempotencyRecord } from '../../../src/persistence/IdempotencyRecord.js';
import type { IdempotencyRecordStatusValue } from '../../../src/types/index.js';

const mockIdempotencyKey = '123';
const mockData = undefined;
let mockInProgressExpiry: number;
let mockExpiryTimestamp: number;
const mockPayloadHash = '123';

describe('class: IdempotencyRecord', () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date());
    mockInProgressExpiry = Date.now() + 10_000;
    mockExpiryTimestamp = Date.now() + 20_000;
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns the response data', () => {
    // Prepare
    const idempotencyRecord = new IdempotencyRecord({
      idempotencyKey: mockIdempotencyKey,
      status: IdempotencyRecordStatus.INPROGRESS,
      expiryTimestamp: mockExpiryTimestamp,
      inProgressExpiryTimestamp: mockInProgressExpiry,
      responseData: mockData,
      payloadHash: mockPayloadHash,
    });

    // Act
    const response = idempotencyRecord.getResponse();

    // Assess
    expect(response).toEqual(mockData);
  });

  it('throws an error if the status is invalid', () => {
    // Prepare
    const idempotencyRecord = new IdempotencyRecord({
      idempotencyKey: mockIdempotencyKey,
      status: 'NOT_A_STATUS' as IdempotencyRecordStatusValue,
      expiryTimestamp: mockExpiryTimestamp,
      inProgressExpiryTimestamp: mockInProgressExpiry,
      responseData: mockData,
      payloadHash: mockPayloadHash,
    });

    // Act
    expect(() => idempotencyRecord.getStatus()).toThrow(
      IdempotencyInvalidStatusError
    );
  });
});

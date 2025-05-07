import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { IdempotencyRecordStatus } from '../../../src/constants.js';
import {
  IdempotencyItemNotFoundError,
  IdempotencyPersistenceConsistencyError,
} from '../../../src/errors.js';
import { IdempotencyRecord } from '../../../src/persistence/IdempotencyRecord.js';
import { RedisPersistenceLayerTestClass } from '../../helpers/idempotencyUtils.js';

vi.mock('../../../src/persistence/RedisConnection.js');

const getFutureTimestamp = (seconds: number): number =>
  Math.floor(Date.now() / 1000) + seconds;
const getFutureTimestampInMillis = (seconds: number): number =>
  getFutureTimestamp(seconds) * 1000;

const dummyKey = 'someKey';
const client = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};
const persistenceLayer = new RedisPersistenceLayerTestClass({
  client,
});

describe('Class: RedisPersistenceLayerTestClass', () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('Method: _putRecord', () => {
    it('puts a record with INPROGRESS status into Redis', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
      });
      client.set.mockResolvedValue('OK');

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        JSON.stringify({
          status: IdempotencyRecordStatus.INPROGRESS,
          expiration: record.expiryTimestamp,
        }),
        { EX: 10, NX: true }
      );
    });

    it('puts the record in Redis when using an in progress expiry timestamp', async () => {
      // Prepare
      const status = IdempotencyRecordStatus.INPROGRESS;
      const expiryTimestamp = getFutureTimestamp(10);
      const inProgressExpiryTimestamp = getFutureTimestampInMillis(5);
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
        inProgressExpiryTimestamp,
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        JSON.stringify({
          status,
          expiration: expiryTimestamp,
          in_progress_expiration: inProgressExpiryTimestamp,
        }),
        { EX: 10, NX: true }
      );
    });

    it('puts record in Redis when using payload validation', async () => {
      // Prepare
      const persistenceLayerSpy = vi
        .spyOn(persistenceLayer, 'isPayloadValidationEnabled')
        .mockReturnValue(true);
      const expiryTimestamp = getFutureTimestamp(10);
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp,
        payloadHash: 'someHash',
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        JSON.stringify({
          status: IdempotencyRecordStatus.INPROGRESS,
          expiration: expiryTimestamp,
          validation: 'someHash',
        }),
        { EX: 10, NX: true }
      );
      persistenceLayerSpy.mockRestore();
    });

    it('puts record in Redis with default expiry timestamp', async () => {
      // Prepare
      const status = IdempotencyRecordStatus.INPROGRESS;
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        JSON.stringify({
          status,
        }),
        { EX: 60 * 60, NX: true }
      );
    });

    it('handles orphaned records by acquiring a lock and updating', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
      });

      client.set.mockResolvedValueOnce(null).mockResolvedValueOnce('OK');
      client.get.mockResolvedValueOnce(
        JSON.stringify({
          status: IdempotencyRecordStatus.INPROGRESS,
          expiration: getFutureTimestamp(-10),
        })
      );
      const consoleDebugSpy = vi.spyOn(console, 'debug');

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Acquiring lock to overwrite orphan record'
      );
      expect(client.set).toHaveBeenCalledWith(
        `${dummyKey}:lock`,
        'true',
        expect.objectContaining({ EX: 10, NX: true })
      );
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Lock acquired, updating record'
      );
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        JSON.stringify({
          status: IdempotencyRecordStatus.INPROGRESS,
          expiration: record.expiryTimestamp,
        }),
        { EX: 10 }
      );
    });

    it('handles orphaned records by acquiring a lock but it fails and throw error', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
      });

      client.set
        .mockResolvedValueOnce(null) // First attempt to set fails
        .mockResolvedValueOnce(null); // Lock acquisition fails
      client.get.mockResolvedValueOnce(
        JSON.stringify({
          status: IdempotencyRecordStatus.INPROGRESS,
          expiration: getFutureTimestamp(-10),
        })
      );

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrow(
        'Lock acquisition failed, raise to retry'
      );
    });

    it('throws error when item already exists and not expired', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
      });
      client.set.mockResolvedValue(null);
      client.get.mockResolvedValueOnce(
        JSON.stringify({
          status: IdempotencyRecordStatus.COMPLETED,
          expiration: getFutureTimestamp(10),
        })
      );

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrow(
        `Failed to put record for already existing idempotency key: ${dummyKey}`
      );
    });

    it('throws error when item is in progress', async () => {
      // Prepare
      const inProgressExpiryTimestamp = getFutureTimestampInMillis(10);
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
      });
      client.set.mockResolvedValue(null);
      client.get.mockResolvedValueOnce(
        JSON.stringify({
          status: IdempotencyRecordStatus.INPROGRESS,
          in_progress_expiration: inProgressExpiryTimestamp,
        })
      );

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrow(
        `Failed to put record for in-progress idempotency key: ${dummyKey}`
      );
    });

    it('throws error when trying to put a non-INPROGRESS record', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.COMPLETED,
        expiryTimestamp: getFutureTimestamp(10),
      });

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrow(
        'Only INPROGRESS records can be inserted with _putRecord'
      );
    });
  });

  describe('Method: _deleteRecord', () => {
    it('deletes a record from Redis', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.COMPLETED,
        expiryTimestamp: getFutureTimestamp(15),
      });
      const consoleDebugSpy = vi.spyOn(console, 'debug');

      // Act
      await persistenceLayer._deleteRecord(record);

      // Assess
      expect(client.del).toHaveBeenCalledWith([dummyKey]);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `Deleting record for idempotency key: ${record.idempotencyKey}`
      );
    });
  });

  describe('Method: _getRecord', () => {
    it('gets a record from Redis', async () => {
      // Prepare
      const status = IdempotencyRecordStatus.INPROGRESS;
      const expiryTimestamp = getFutureTimestamp(15);
      const inProgressExpiryTimestamp = getFutureTimestampInMillis(15);
      client.get.mockResolvedValue(
        JSON.stringify({
          status,
          expiration: expiryTimestamp,
          in_progress_expiration: inProgressExpiryTimestamp,
          validation: 'someHash',
          data: { some: 'data' },
        })
      );

      // Act
      const record = await persistenceLayer._getRecord(dummyKey);

      // Assess
      expect(client.get).toHaveBeenCalledWith(dummyKey);
      expect(record.getStatus()).toEqual(status);
      expect(record.expiryTimestamp).toEqual(expiryTimestamp);
      expect(record.inProgressExpiryTimestamp).toEqual(
        inProgressExpiryTimestamp
      );
      expect(record.payloadHash).toEqual('someHash');
      expect(record.getResponse()).toEqual({ some: 'data' });
    });

    it('throws IdempotencyItemNotFoundError when record does not exist', async () => {
      // Prepare
      client.get.mockResolvedValue(null);

      // Act & Assess
      await expect(persistenceLayer._getRecord(dummyKey)).rejects.toThrow(
        IdempotencyItemNotFoundError
      );
    });

    it('throws IdempotencyPersistenceConsistencyError when record is invalid JSON', async () => {
      // Prepare
      client.get.mockResolvedValue('invalid-json');

      // Act & Assess
      await expect(persistenceLayer._getRecord(dummyKey)).rejects.toThrow(
        IdempotencyPersistenceConsistencyError
      );
    });
  });

  describe('Method: _updateRecord', () => {
    it('updates a record in Redis', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.COMPLETED,
        expiryTimestamp: getFutureTimestamp(15),
      });
      client.set.mockResolvedValue('OK');

      // Act
      await persistenceLayer._updateRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        JSON.stringify({
          status: 'COMPLETED',
          expiration: record.expiryTimestamp,
        }),
        expect.objectContaining({ EX: expect.any(Number) })
      );
    });

    it('updates a record with null responseData', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.COMPLETED,
        expiryTimestamp: getFutureTimestamp(15),
        responseData: undefined,
      });
      client.set.mockResolvedValue('OK');

      // Act
      await persistenceLayer._updateRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        JSON.stringify({
          status: 'COMPLETED',
          expiration: record.expiryTimestamp,
        }),
        expect.objectContaining({ EX: expect.any(Number) })
      );
    });

    it('updates a record with valid responseData', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.COMPLETED,
        expiryTimestamp: getFutureTimestamp(15),
        responseData: { key: 'value' },
      });
      client.set.mockResolvedValue('OK');

      // Act
      await persistenceLayer._updateRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        JSON.stringify({
          status: 'COMPLETED',
          expiration: record.expiryTimestamp,
          data: record.responseData,
        }),
        expect.objectContaining({ EX: expect.any(Number) })
      );
    });
  });
});

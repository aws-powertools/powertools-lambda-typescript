import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { IdempotencyRecordStatus } from '../../../src/constants.js';
import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
  IdempotencyPersistenceConsistencyError,
} from '../../../src/errors.js';
import { IdempotencyRecord } from '../../../src/persistence/IdempotencyRecord.js';
import { CachePersistenceLayerTestClass } from '../../helpers/idempotencyUtils.js';

const getFutureTimestamp = (seconds: number): number =>
  Math.floor(Date.now() / 1000) + seconds;
const getFutureTimestampInMillis = (seconds: number): number =>
  getFutureTimestamp(seconds) * 1000;

const now = new Date('2026-01-01T00:00:00.000Z');
const dummyKey = 'someKey';
const client = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};
const persistenceLayer = new CachePersistenceLayerTestClass({
  client,
});

describe('Class: CachePersistenceLayerTestClass', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(() => {
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('Method: _putRecord', () => {
    it('puts a record with INPROGRESS status into the cache', async () => {
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
        {
          EX: 10,
          NX: true,
          expiry: { type: 'EX', count: 10 },
          conditionalSet: 'onlyIfDoesNotExist',
        }
      );
    });

    it('expires an in progress record at its execution deadline', async () => {
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
        {
          EX: 5,
          NX: true,
          expiry: { type: 'EX', count: 5 },
          conditionalSet: 'onlyIfDoesNotExist',
        }
      );
    });

    it('rounds the execution deadline up to whole seconds', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
        inProgressExpiryTimestamp: Date.now() + 4_200,
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        expect.any(String),
        expect.objectContaining({ EX: 5, expiry: { type: 'EX', count: 5 } })
      );
    });

    it('caps the in progress record expiry at the overall expiry', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
        inProgressExpiryTimestamp: getFutureTimestampInMillis(20),
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(
        dummyKey,
        expect.any(String),
        expect.objectContaining({ EX: 10, expiry: { type: 'EX', count: 10 } })
      );
    });

    it('puts record in the cache when using payload validation', async () => {
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
        {
          EX: 10,
          NX: true,
          expiry: { type: 'EX', count: 10 },
          conditionalSet: 'onlyIfDoesNotExist',
        }
      );
      persistenceLayerSpy.mockRestore();
    });

    it('puts record in the cache with default expiry timestamp', async () => {
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
        {
          EX: 60 * 60,
          NX: true,
          expiry: { type: 'EX', count: 60 * 60 },
          conditionalSet: 'onlyIfDoesNotExist',
        }
      );
    });

    it('retries the write once when the record expires between the conflict and the read', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
      });
      client.set.mockResolvedValueOnce(null).mockResolvedValueOnce('OK');
      client.get.mockResolvedValueOnce(null);

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledTimes(2);
      expect(client.set).toHaveBeenLastCalledWith(
        dummyKey,
        expect.any(String),
        {
          EX: 10,
          NX: true,
          expiry: { type: 'EX', count: 10 },
          conditionalSet: 'onlyIfDoesNotExist',
        }
      );
    });

    it('gives up after one retry when the record keeps vanishing', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
      });
      client.set.mockResolvedValue(null);
      client.get.mockResolvedValue(null);

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrow(
        IdempotencyItemNotFoundError
      );
      expect(client.set).toHaveBeenCalledTimes(2);
    });

    it('propagates read errors other than a missing record', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp: getFutureTimestamp(10),
      });
      client.set.mockResolvedValueOnce(null);
      client.get.mockResolvedValueOnce('not json');

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrow(
        IdempotencyPersistenceConsistencyError
      );
      expect(client.set).toHaveBeenCalledTimes(1);
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
        IdempotencyItemAlreadyExistsError
      );
    });

    it('preserves an unexpired in-progress record without an execution deadline', async () => {
      // Prepare
      const expiryTimestamp = getFutureTimestamp(3600);
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.INPROGRESS,
        expiryTimestamp,
      });
      const cacheClient = {
        get: vi.fn().mockResolvedValue(
          JSON.stringify({
            status: IdempotencyRecordStatus.INPROGRESS,
            expiration: expiryTimestamp,
          })
        ),
        set: vi.fn().mockResolvedValue('OK').mockResolvedValueOnce(null),
        del: vi.fn(),
      };
      const persistenceStore = new CachePersistenceLayerTestClass({
        client: cacheClient,
      });

      // Act
      const acquisition = persistenceStore._putRecord(record);

      // Assess
      await expect(acquisition).rejects.toThrow(
        IdempotencyItemAlreadyExistsError
      );
      expect(cacheClient.set).toHaveBeenCalledTimes(1);
    });

    it.each([
      { label: 'an elapsed execution deadline', deadline: 'elapsed' },
      { label: 'an execution deadline of zero', deadline: 'zero' },
    ])(
      'returns a present record with $label to the caller instead of overwriting it',
      async ({ deadline }) => {
        // Prepare
        const expiryTimestamp = getFutureTimestamp(3600);
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiryTimestamp,
          inProgressExpiryTimestamp: Date.now() + 60_000,
        });
        const cacheClient = {
          get: vi.fn().mockResolvedValue(
            JSON.stringify({
              status: IdempotencyRecordStatus.INPROGRESS,
              expiration: expiryTimestamp,
              in_progress_expiration:
                deadline === 'zero' ? 0 : Date.now() - 1000,
            })
          ),
          set: vi.fn().mockResolvedValueOnce(null),
          del: vi.fn(),
        };
        const persistenceStore = new CachePersistenceLayerTestClass({
          client: cacheClient,
        });

        // Act
        const acquisition = persistenceStore._putRecord(record);

        // Assess
        await expect(acquisition).rejects.toThrow(
          IdempotencyItemAlreadyExistsError
        );
        expect(cacheClient.set).toHaveBeenCalledTimes(1);
      }
    );

    it('does not overwrite a record completed after a stale read', async () => {
      // Prepare
      const store = new Map<string, string>();
      let releaseRead: (value: string | null) => void = () => {};
      const cacheClient = {
        get: vi.fn(async (key: string) => store.get(key) ?? null),
        set: vi.fn(
          async (key: string, value: string, options?: { NX?: boolean }) => {
            if (options?.NX && store.has(key)) return null;
            store.set(key, value);
            return 'OK';
          }
        ),
        del: vi.fn(async (keys: string[]) => {
          for (const key of keys) store.delete(key);
          return keys.length;
        }),
      };
      const callerA = new CachePersistenceLayerTestClass({
        client: cacheClient,
      });
      const callerB = new CachePersistenceLayerTestClass({
        client: cacheClient,
      });
      const event = { id: 'order-1' };
      const remainingTimeInMillis = 2_000;

      // Act
      await callerA.saveInProgress(event, remainingTimeInMillis);
      const [recordKey] = store.keys();
      const staleRecord = store.get(recordKey) as string;
      // B's read is answered only after A completes and A's deadline passes
      cacheClient.get.mockImplementationOnce(
        () => new Promise<string | null>((resolve) => (releaseRead = resolve))
      );
      const acquisition = callerB.saveInProgress(event, remainingTimeInMillis);
      await vi.waitFor(() => expect(cacheClient.get).toHaveBeenCalledTimes(1));
      await callerA.saveSuccess(event, { processed: true });
      vi.setSystemTime(Date.now() + remainingTimeInMillis + 1_000);
      releaseRead(staleRecord);

      // Assess
      await expect(acquisition).rejects.toThrow(
        IdempotencyItemAlreadyExistsError
      );
      expect(JSON.parse(store.get(recordKey) as string)).toMatchObject({
        status: IdempotencyRecordStatus.COMPLETED,
        data: { processed: true },
      });
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
    it('deletes a record from the cache', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.COMPLETED,
        expiryTimestamp: getFutureTimestamp(15),
      });

      // Act
      await persistenceLayer._deleteRecord(record);

      // Assess
      expect(client.del).toHaveBeenCalledWith([dummyKey]);
    });
  });

  describe('Method: _getRecord', () => {
    it('gets a record from the cache', async () => {
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
    it('updates a record in the cache', async () => {
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
        { EX: 15, expiry: { type: 'EX', count: 15 } }
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
        { EX: 15, expiry: { type: 'EX', count: 15 } }
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
        { EX: 15, expiry: { type: 'EX', count: 15 } }
      );
    });

    it('keeps the payload hash when updating a record with payload validation', async () => {
      // Prepare
      const persistenceLayerSpy = vi
        .spyOn(persistenceLayer, 'isPayloadValidationEnabled')
        .mockReturnValue(true);
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.COMPLETED,
        expiryTimestamp: getFutureTimestamp(15),
        responseData: { key: 'value' },
        payloadHash: 'someHash',
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
          validation: 'someHash',
        }),
        { EX: 15, expiry: { type: 'EX', count: 15 } }
      );
      persistenceLayerSpy.mockRestore();
    });

    it('rounds the expiry down so the record never outlives it', async () => {
      // Prepare
      const expiryTimestamp = getFutureTimestamp(15);
      vi.setSystemTime(now.getTime() + 300);
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.COMPLETED,
        expiryTimestamp,
      });

      // Act
      await persistenceLayer._updateRecord(record);

      // Assess
      expect(client.set).toHaveBeenCalledWith(dummyKey, expect.any(String), {
        EX: 14,
        expiry: { type: 'EX', count: 14 },
      });
    });
  });
});

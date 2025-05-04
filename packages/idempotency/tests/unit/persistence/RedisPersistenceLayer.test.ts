import {
  type Mock,
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
import { IdempotencyPersistenceConnectionError } from '../../../src/errors.js';
import { IdempotencyRecord } from '../../../src/persistence/IdempotencyRecord.js';
import RedisConnection from '../../../src/persistence/RedisConnection.js';
import type { RedisClientProtocol } from '../../../src/types/RedisPersistence.js';
import { RedisPersistenceLayerTestClass } from '../../helpers/idempotencyUtils.js';

vi.mock('../../../src/persistence/RedisConnection.js');

const getFutureTimestamp = (seconds: number): number =>
  new Date().getTime() + seconds * 1000;

describe('Class: RedisPersistenceLayerTestClass', () => {
  const mockDefaultClientConnect = vi.fn().mockResolvedValue(true);

  const mockDefaultClient = {
    isOpen: false,
    connect: mockDefaultClientConnect,
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn().mockResolvedValue(1),
  };

  const mockUserProvidedClient: RedisClientProtocol = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };

  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date());
  });

  beforeEach(() => {
    vi.clearAllMocks();

    (RedisConnection as unknown as Mock).mockImplementation(() => ({
      getClient: vi.fn().mockReturnValue(mockDefaultClient),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('Method: init', () => {
    it('should create a Redis connection and connect when no client is provided', async () => {
      // Prepare
      const layer = new RedisPersistenceLayerTestClass({});

      // Act
      await layer.init();

      // Assess
      expect(RedisConnection).toHaveBeenCalledTimes(1);
      expect(mockDefaultClientConnect).toHaveBeenCalledTimes(1);
    });

    it('should throw IdempotencyPersistenceConnectionError when connection fails', async () => {
      // Prepare
      mockDefaultClientConnect.mockRejectedValueOnce(
        new Error('Connection failed')
      );
      const layer = new RedisPersistenceLayerTestClass({});
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act & Assess
      await expect(layer.init()).rejects.toThrow(
        new IdempotencyPersistenceConnectionError(
          'Could not connect to Redis',
          new Error('Connection failed')
        )
      );
      expect(mockDefaultClientConnect).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to connect to Redis:',
        expect.any(Error)
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should not attempt to connect if the client is already connected', async () => {
      // Prepare
      const connectedClient = {
        isOpen: true,
        connect: vi.fn().mockResolvedValue(undefined),
      };

      (RedisConnection as unknown as Mock).mockImplementation(() => ({
        getClient: vi.fn().mockReturnValue(connectedClient),
      }));

      const layer = new RedisPersistenceLayerTestClass({});

      // Act
      await layer.init();

      // Assess
      expect(RedisConnection).toHaveBeenCalledTimes(1);
      expect(connectedClient.connect).not.toHaveBeenCalled();
    });

    it('will do nothing if a user-provided client is used', async () => {
      // Prepare
      const layer = new RedisPersistenceLayerTestClass({
        client: mockUserProvidedClient,
      });

      // Act
      await layer.init();

      // Assess
      expect(RedisConnection).not.toHaveBeenCalled();
      expect(mockDefaultClientConnect).not.toHaveBeenCalled();
    });
  });

  describe('Method: _putRecord', () => {
    const dummyKey = 'someKey';

    describe('when a user-provided client is used', () => {
      it('puts a record with INPROGRESS status into Redis', async () => {
        // Prepare
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiryTimestamp: getFutureTimestamp(10),
        });
        mockDefaultClient.set.mockResolvedValue('OK');

        // Act
        await layer._putRecord(record);

        // Assess
        expect(mockDefaultClient.set).toHaveBeenCalledWith(
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
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const status = IdempotencyRecordStatus.INPROGRESS;
        const expiryTimestamp = getFutureTimestamp(10);
        const inProgressExpiryTimestamp = getFutureTimestamp(5);
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status,
          expiryTimestamp,
          inProgressExpiryTimestamp,
        });

        // Act
        await layer._putRecord(record);

        // Assess
        expect(mockDefaultClient.set).toHaveBeenCalledWith(
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
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const persistenceLayerSpy = vi
          .spyOn(layer, 'isPayloadValidationEnabled')
          .mockReturnValue(true);
        const expiryTimestamp = getFutureTimestamp(10);
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiryTimestamp,
          payloadHash: 'someHash',
        });

        // Act
        await layer._putRecord(record);

        // Assess
        expect(mockDefaultClient.set).toHaveBeenCalledWith(
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
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const status = IdempotencyRecordStatus.INPROGRESS;
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status,
        });

        // Act
        await layer._putRecord(record);

        // Assess
        expect(mockDefaultClient.set).toHaveBeenCalledWith(
          dummyKey,
          JSON.stringify({
            status,
          }),
          { EX: 60 * 60, NX: true }
        );
      });

      it('handles orphaned records by acquiring a lock and updating', async () => {
        // Prepare
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiryTimestamp: getFutureTimestamp(10),
        });

        mockDefaultClient.set
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce('OK');
        mockDefaultClient.get.mockResolvedValueOnce(
          JSON.stringify({
            status: IdempotencyRecordStatus.INPROGRESS,
            expiration: getFutureTimestamp(-10),
          })
        );
        const consoleDebugSpy = vi.spyOn(console, 'debug');

        // Act
        await layer._putRecord(record);

        // Assess
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          'Acquiring lock to overwrite orphan record'
        );
        expect(mockDefaultClient.set).toHaveBeenCalledWith(
          `${dummyKey}:lock`,
          'true',
          expect.objectContaining({ EX: 10, NX: true })
        );
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          'Lock acquired, updating record'
        );
        expect(mockDefaultClient.set).toHaveBeenCalledWith(
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
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiryTimestamp: getFutureTimestamp(10),
        });

        mockDefaultClient.set
          .mockResolvedValueOnce(null) // First attempt to set fails
          .mockResolvedValueOnce(null); // Lock acquisition fails
        mockDefaultClient.get.mockResolvedValueOnce(
          JSON.stringify({
            status: IdempotencyRecordStatus.INPROGRESS,
            expiration: getFutureTimestamp(-10),
          })
        );

        // Act
        await expect(layer._putRecord(record)).rejects.toThrow(
          'Lock acquisition failed, raise to retry'
        );
      });

      it('throws error when item already exists and not expired', async () => {
        // Prepare
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiryTimestamp: getFutureTimestamp(10),
        });
        mockDefaultClient.set.mockResolvedValue(null);
        mockDefaultClient.get.mockResolvedValueOnce(
          JSON.stringify({
            status: IdempotencyRecordStatus.COMPLETED,
            expiration: getFutureTimestamp(10),
          })
        );

        // Act & Assess
        await expect(layer._putRecord(record)).rejects.toThrow(
          `Failed to put record for already existing idempotency key: ${dummyKey}`
        );
      });

      it('throws error when item is in progress', async () => {
        // Prepare
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const inProgressExpiryTimestamp = getFutureTimestamp(10);
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiryTimestamp: getFutureTimestamp(10),
        });
        mockDefaultClient.set.mockResolvedValue(null);
        mockDefaultClient.get.mockResolvedValueOnce(
          JSON.stringify({
            status: IdempotencyRecordStatus.INPROGRESS,
            in_progress_expiration: inProgressExpiryTimestamp,
          })
        );

        // Act & Assess
        await expect(layer._putRecord(record)).rejects.toThrow(
          `Failed to put record for in-progress idempotency key: ${dummyKey}`
        );
      });

      it('throws error when trying to put a non-INPROGRESS record', async () => {
        // Prepare
        const layer = new RedisPersistenceLayerTestClass({});
        await layer.init();
        const record = new IdempotencyRecord({
          idempotencyKey: dummyKey,
          status: IdempotencyRecordStatus.COMPLETED,
          expiryTimestamp: getFutureTimestamp(10),
        });

        // Act & Assess
        await expect(layer._putRecord(record)).rejects.toThrow(
          'Only INPROGRESS records can be inserted with _putRecord'
        );
      });
    });
  });
});

import {
  type Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { IdempotencyPersistenceConnectionError } from '../../../src/errors.js';
import RedisConnection from '../../../src/persistence/RedisConnection.js';
import { RedisPersistenceLayer } from '../../../src/persistence/RedisPersistenceLayer.js';
import type { RedisClientProtocol } from '../../../src/types/RedisPersistence.js';

vi.mock('../../../src/persistence/RedisConnection.js');

describe('Class: RedisPersistenceLayer', () => {
  const mockDefaultClientConnect = vi.fn().mockResolvedValue(undefined);

  const mockDefaultClient = {
    isOpen: false,
    connect: mockDefaultClientConnect,
  };

  const mockUserProvidedClient: RedisClientProtocol = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (RedisConnection as unknown as Mock).mockImplementation(() => ({
      getClient: vi.fn().mockReturnValue(mockDefaultClient),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Method: init', () => {
    it('should create a Redis connection and connect when no client is provided', async () => {
      // Prepare
      const layer = new RedisPersistenceLayer({});

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
      const layer = new RedisPersistenceLayer({});
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

      const layer = new RedisPersistenceLayer({});

      // Act
      await layer.init();

      // Assess
      expect(RedisConnection).toHaveBeenCalledTimes(1);
      expect(connectedClient.connect).not.toHaveBeenCalled();
    });

    it('will do nothing if a user-provided client is used', async () => {
      // Prepare
      const layer = new RedisPersistenceLayer({
        client: mockUserProvidedClient,
      });

      // Act
      await layer.init();

      // Assess
      expect(RedisConnection).not.toHaveBeenCalled();
      expect(mockDefaultClientConnect).not.toHaveBeenCalled();
    });
  });
});

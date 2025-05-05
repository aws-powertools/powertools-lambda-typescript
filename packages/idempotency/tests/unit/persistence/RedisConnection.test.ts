import { createClient, createCluster } from '@redis/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RedisConnection from '../../../src/persistence/RedisConnection.js';

vi.mock('@redis/client', () => ({
  createClient: vi.fn(),
  createCluster: vi.fn(),
}));

describe('Class: RedisConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Method: constructor', () => {
    it('creates an instance with default values', () => {
      // Prepare & Act
      const connection = new RedisConnection({});

      // Assess
      expect(connection).toBeInstanceOf(RedisConnection);
    });

    it('creates an instance with provided values', () => {
      // Prepare & Act
      const connection = new RedisConnection({
        mode: 'standalone',
        host: 'localhost',
        port: 6379,
        username: 'user',
        password: 'pass',
        dbIndex: 1,
        ssl: false,
      });

      // Assess
      expect(connection).toBeInstanceOf(RedisConnection);
    });
  });

  describe('Method: getClient', () => {
    const url = 'redis://localhost:6379';
    it('creates a standalone client by default', () => {
      // Prepare
      const connection = new RedisConnection({});

      // Act
      connection.getClient();

      // Assess
      expect(createClient).toHaveBeenCalledTimes(1);
      expect(createCluster).not.toHaveBeenCalled();
    });

    it('creates a standalone client with URL configuration', () => {
      // Prepare
      const connection = new RedisConnection({ url });

      // Act
      connection.getClient();

      // Assess
      expect(createClient).toHaveBeenCalledWith({ url });
      expect(createCluster).not.toHaveBeenCalled();
    });

    it('creates a standalone client with host and port configuration', () => {
      // Prepare
      const connection = new RedisConnection({
        host: 'localhost',
        port: 6380,
        username: 'user',
        password: 'pass',
        dbIndex: 2,
      });

      // Act
      connection.getClient();

      // Assess
      expect(createClient).toHaveBeenCalledWith({
        username: 'user',
        password: 'pass',
        socket: {
          host: 'localhost',
          port: 6380,
          tls: true,
        },
        database: 2,
      });
      expect(createCluster).not.toHaveBeenCalled();
    });

    it('creates a standalone client without `tls` when `ssl` is false', () => {
      // Prepare
      const connection = new RedisConnection({
        host: 'localhost',
        port: 6380,
        username: 'user',
        password: 'pass',
        dbIndex: 2,
        ssl: false,
      });

      // Act
      connection.getClient();

      // Assess
      expect(createClient).toHaveBeenCalledWith({
        username: 'user',
        password: 'pass',
        socket: {
          host: 'localhost',
          port: 6380,
        },
        database: 2,
      });
      expect(createCluster).not.toHaveBeenCalled();
    });

    it('creates a cluster client when mode is set to cluster', () => {
      // Prepare
      const connection = new RedisConnection({
        mode: 'cluster',
        url,
      });

      // Act
      connection.getClient();

      // Assess
      expect(createCluster).toHaveBeenCalledTimes(1);
      expect(createCluster).toHaveBeenCalledWith({
        rootNodes: [{ url }],
      });
      expect(createClient).not.toHaveBeenCalled();
    });

    it('prioritizes URL over host/port when both are provided', () => {
      const connection = new RedisConnection({
        url,
        host: 'localhost',
        port: 6380,
      });
      connection.getClient();
      expect(createClient).toHaveBeenCalledWith({ url });
    });
  });
});

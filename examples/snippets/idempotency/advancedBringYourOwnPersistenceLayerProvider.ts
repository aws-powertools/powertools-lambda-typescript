import type { ProviderItem } from './types.js';

/**
 * This is a mock implementation of an SDK client for a generic key-value store.
 */
class ProviderClient {
  public constructor(_config: { apiKey: string; defaultTtlSeconds: number }) {
    // ...
  }

  public async delete(_collectionName: string, _key: string): Promise<void> {
    // ...
  }

  public async get(
    _collectionName: string,
    _key: string
  ): Promise<ProviderItem> {
    // ...
    return {} as ProviderItem;
  }

  public async put(
    _collectionName: string,
    _key: string,
    _value: Partial<ProviderItem>,
    _options: { ttl: number }
  ): Promise<ProviderItem> {
    // ...
    return {} as ProviderItem;
  }

  public async update(
    _collectionName: string,
    _key: string,
    _value: Partial<ProviderItem>
  ): Promise<void> {
    // ...
  }
}

class ProviderItemAlreadyExists extends Error {}

export { ProviderClient, ProviderItemAlreadyExists };

import type { BaseProviderInterface } from '../types/BaseProvider.js';

// These providers are dinamycally intialized on first use of the helper functions
const DEFAULT_PROVIDERS: Record<string, BaseProviderInterface> = {};

/**
 * Utility function to clear all the caches of the default providers.
 *
 * This is useful when you want to clear the cache of all the providers at once, for example during testing.
 */
const clearCaches = (): void => {
  for (const provider of Object.values(DEFAULT_PROVIDERS)) {
    if (provider.clearCache) {
      provider.clearCache();
    }
  }
};

export { DEFAULT_PROVIDERS, clearCaches };

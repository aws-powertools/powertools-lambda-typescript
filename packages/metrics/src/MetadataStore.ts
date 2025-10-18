import { InvokeStore } from '@aws/lambda-invoke-store';

/**
 * Manages storage of metrics #metadata with automatic context detection.
 *
 * This class abstracts the storage mechanism for metrics, automatically
 * choosing between AsyncLocalStorage (when in async context) and a fallback
 * object (when outside async context). The decision is made at runtime on
 * every method call to support Lambda's transition to async contexts.
 */
class MetadataStore {
  readonly #metadataKey = Symbol('powertools.metrics.metadata');

  #fallbackStorage: Record<string, string> = {};

  #getStorage(): Record<string, string> {
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackStorage;
    }

    let stored = InvokeStore.get(this.#metadataKey) as
      | Record<string, string>
      | undefined;
    if (stored == null) {
      stored = {};
      InvokeStore.set(this.#metadataKey, stored);
    }
    return stored;
  }

  public set(key: string, value: string): string {
    this.#getStorage()[key] = value;
    return value;
  }

  public getAll(): Record<string, string> {
    return { ...this.#getStorage() };
  }

  public clear(): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackStorage = {};
      return;
    }

    InvokeStore.set(this.#metadataKey, {});
  }
}

export { MetadataStore };

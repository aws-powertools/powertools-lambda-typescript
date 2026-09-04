import { InvocationScoped } from '@aws-lambda-powertools/commons/utils/invocation-scoped';

/**
 * Manages storage of metrics #metadata with automatic context detection.
 *
 * This class abstracts the storage mechanism for metrics, automatically
 * choosing between AsyncLocalStorage (when in async context) and a fallback
 * object (when outside async context). The decision is made at runtime on
 * every method call to support Lambda's transition to async contexts.
 */
class MetadataStore {
  readonly #metadata = new InvocationScoped<Record<string, string>>(
    'powertools.metrics.metadata',
    { fresh: () => ({}) }
  );

  #getStorage(): Record<string, string> {
    return this.#metadata.get();
  }

  public set(key: string, value: string): string {
    this.#getStorage()[key] = value;
    return value;
  }

  public getAll(): Record<string, string> {
    return { ...this.#getStorage() };
  }

  public clear(): void {
    this.#metadata.reset();
  }
}

export { MetadataStore };

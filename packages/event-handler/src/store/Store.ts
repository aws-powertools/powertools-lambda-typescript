/**
 * Public interface for a type-safe key-value store.
 *
 * Use this in type positions (e.g. `RequestContext`) instead of the
 * concrete `Store` class to avoid invariance issues caused by private fields.
 */
interface IStore<T extends Record<string, unknown> = Record<string, unknown>> {
  set<K extends keyof T>(key: K, value: T[K]): void;
  get<K extends keyof T>(key: K): T[K] | undefined;
  has<K extends keyof T>(key: K): boolean;
  delete<K extends keyof T>(key: K): boolean;
}

/**
 * A type-safe key-value store backed by a `Map`.
 *
 * Used for both request-scoped and shared (router-scoped) state
 * in the event handler.
 */
class Store<T extends Record<string, unknown> = Record<string, unknown>>
  implements IStore<T>
{
  #data = new Map<keyof T, T[keyof T]>();

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.#data.set(key, value);
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.#data.get(key) as T[K] | undefined;
  }

  has<K extends keyof T>(key: K): boolean {
    return this.#data.has(key);
  }

  delete<K extends keyof T>(key: K): boolean {
    return this.#data.delete(key);
  }
}

export { Store };
export type { IStore };

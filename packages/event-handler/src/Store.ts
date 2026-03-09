/**
 * A type-safe key-value store backed by a `Map`.
 *
 * Used for both request-scoped and shared (router-scoped) state
 * in the event handler.
 */
class Store<T extends Record<string, unknown> = Record<string, unknown>> {
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

import type { LRUCacheOptions } from './types/LRUCache.js';

const DEFAULT_MAX_SIZE = 100;
const NEWER = Symbol('newer');
const OLDER = Symbol('older');

class Item<K, V> {
  public readonly key: K;
  public value: V;
  private [NEWER]: Item<K, V> | undefined;
  private [OLDER]: Item<K, V> | undefined;

  public constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
    this[NEWER] = undefined;
    this[OLDER] = undefined;
  }
}

/**
 * A simple LRU cache implementation that uses a doubly linked list to track the order of items in
 * an hash map.
 *
 * Illustration of the design:
 *```text
 *   oldest                                                   newest
 *    entry             entry             entry             entry
 *    ______            ______            ______            ______
 *   | head |.newer => |      |.newer => |      |.newer => | tail |
 *   |  A   |          |  B   |          |  C   |          |  D   |
 *   |______| <= older.|______| <= older.|______| <= older.|______|
 *
 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
 * ```
 *
 * Items are added to the cache using the `add()` method. When an item is added, it's marked
 * as the most recently used item. If the cache is full, the oldest item is removed from the
 * cache.
 *
 * Each item also tracks the item that was added before it, and the item that was added after
 * it. This allows us to quickly remove the oldest item from the cache without having to
 * iterate through the entire cache.
 *
 * **Note**: This implementation is loosely based on the implementation found in the lru_map package
 * which is licensed under the MIT license and [recommends users to copy the code into their
 * own projects](https://github.com/rsms/js-lru/tree/master#usage).
 *
 * @typeparam K - The type of the key
 * @typeparam V - The type of the value
 */
class LRUCache<K, V> {
  private leastRecentlyUsed?: Item<K, V>;
  private readonly map: Map<K, Item<K, V>>;
  private readonly maxSize: number;
  private mostRecentlyUsed?: Item<K, V>;

  /**
   * A simple LRU cache implementation that uses a doubly linked list to track the order of items in
   * an hash map.
   *
   * When instatiating the cache, you can optionally specify the type of the key and value, as well
   * as the maximum size of the cache. If no maximum size is specified, the cache will default to
   * a size of 100.
   *
   * @example
   * ```typescript
   * const cache = new LRUCache<string, number>({ maxSize: 100 });
   * // or
   * // const cache = new LRUCache();
   *
   * cache.add('a', 1);
   * cache.add('b', 2);
   *
   * cache.get('a');
   *
   * console.log(cache.size()); // 2
   * ```
   *
   * @param config - The configuration options for the cache
   */
  public constructor(config?: LRUCacheOptions) {
    this.maxSize =
      config?.maxSize !== undefined ? config.maxSize : DEFAULT_MAX_SIZE;
    this.map = new Map();
  }

  /**
   * Adds a new item to the cache.
   *
   * If the key already exists, it updates the value and marks the item as the most recently used.
   * If inserting the new item would exceed the max size, the oldest item is removed from the cache.
   *
   * @param key - The key to add to the cache
   * @param value - The value to add to the cache
   */
  public add(key: K, value: V): void {
    // If the key already exists, we just update the value and mark it as the most recently used
    if (this.map.has(key)) {
      // biome-ignore lint/style/noNonNullAssertion: At this point, we know that the key exists in the map, so we can safely use the non-null
      const item = this.map.get(key)!;
      item.value = value;
      this.trackItemUse(item);

      return;
    }

    // If the key doesn't exist, we add it to the map
    const item = new Item(key, value);
    this.map.set(key, item);

    // If there's an existing newest item, link it to the new item
    if (this.mostRecentlyUsed) {
      this.mostRecentlyUsed[NEWER] = item;
      item[OLDER] = this.mostRecentlyUsed;
      // If there's no existing newest item, this is the first item (oldest and newest)
    } else {
      this.leastRecentlyUsed = item;
    }

    // The new item is now the newest item
    this.mostRecentlyUsed = item;

    // If the map is full, we remove the oldest entry
    if (this.map.size > this.maxSize) {
      this.shift();
    }
  }

  /**
   * Returns a value from the cache, or undefined if it's not in the cache.
   *
   * When a value is returned, it's marked as the most recently used item in the cache.
   *
   * @param key - The key to retrieve from the cache
   */
  public get(key: K): V | undefined {
    const item = this.map.get(key);
    if (!item) return;
    this.trackItemUse(item);

    return item.value;
  }

  /**
   * Returns `true` if the key exists in the cache, `false` otherwise.
   *
   * @param key - The key to check for in the cache
   */
  public has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * Removes an item from the cache, while doing so it also reconciles the linked list.
   *
   * @param key - The key to remove from the cache
   */
  public remove(key: K): void {
    const item = this.map.get(key);
    if (!item) return;

    this.map.delete(key);
    if (item[NEWER] && item[OLDER]) {
      // relink the older entry with the newer entry
      item[OLDER][NEWER] = item[NEWER];
      item[NEWER][OLDER] = item[OLDER];
    } else if (item[NEWER]) {
      // remove the link to us
      item[NEWER][OLDER] = undefined;
      // link the newer entry to head
      this.leastRecentlyUsed = item[NEWER];
    } else if (item[OLDER]) {
      // remove the link to us
      item[OLDER][NEWER] = undefined;
      // link the newer entry to head
      this.mostRecentlyUsed = item[OLDER];
    } else {
      this.leastRecentlyUsed = this.mostRecentlyUsed = undefined;
    }
  }

  /**
   * Returns the current size of the cache.
   */
  public size(): number {
    return this.map.size;
  }

  /**
   * Removes the oldest item from the cache and unlinks it from the linked list.
   */
  private shift(): void {
    // biome-ignore lint/style/noNonNullAssertion: If this function is called, we know that the least recently used item exists
    const item = this.leastRecentlyUsed!;

    // If there's a newer item, make it the oldest
    if (item[NEWER]) {
      this.leastRecentlyUsed = item[NEWER];
      this.leastRecentlyUsed[OLDER] = undefined;
    }

    // Remove the item from the map
    this.map.delete(item.key);
    item[NEWER] = undefined;
    item[OLDER] = undefined;
  }

  /**
   * Marks an item as the most recently used item in the cache.
   *
   * @param item - The item to mark as the most recently used
   */
  private trackItemUse(item: Item<K, V>): void {
    // If the item is already the newest, we don't need to do anything
    if (this.mostRecentlyUsed === item) return; // TODO: check this

    // If the item is not the newest, we need to mark it as the newest
    if (item[NEWER]) {
      if (item === this.leastRecentlyUsed) {
        this.leastRecentlyUsed = item[NEWER];
      }
      item[NEWER][OLDER] = item[OLDER];
    }
    if (item[OLDER]) {
      item[OLDER][NEWER] = item[NEWER];
    }
    item[NEWER] = undefined;
    item[OLDER] = this.mostRecentlyUsed;
    if (this.mostRecentlyUsed) {
      this.mostRecentlyUsed[NEWER] = item;
    }
    this.mostRecentlyUsed = item;
  }
}

export { LRUCache };

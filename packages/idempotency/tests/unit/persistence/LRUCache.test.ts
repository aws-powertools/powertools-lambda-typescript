/**
 * Test LRUCache class
 *
 * @group unit/idempotency/persistence/lru-cache
 */
import { LRUCache } from '../../../src/persistence/LRUCache.js';

describe('Class: LRUMap', () => {
  describe('Method: add', () => {
    test('when called it adds items to the cache', () => {
      // Prepare
      const cache = new LRUCache();

      // Act
      cache.add('a', 1);
      cache.add('b', 2);

      // Assess
      expect(cache.size()).toBe(2);
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    test('when called it updates the value of an existing key', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);

      // Act
      cache.add('a', 2);

      // Assess
      expect(cache.size()).toBe(1);
      expect(cache.get('a')).toBe(2);
    });

    test('when called it removes the oldest item when the cache is full', () => {
      // Prepare
      const cache = new LRUCache({ maxSize: 2 });
      cache.add('a', 1);
      cache.add('b', 2);

      // Act
      cache.add('c', 3);

      // Assess
      expect(cache.size()).toBe(2);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });

    test('when called and maxSize is 0, it skips cache', () => {
      // Prepare
      const cache = new LRUCache({ maxSize: 0 });

      // Act
      cache.add('a', 1);

      // Assess
      expect(cache.size()).toBe(0);
    });
  });

  describe('Method: get', () => {
    test('when called it returns the value of an existing key', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);

      // Act
      const value = cache.get('a');

      // Assess
      expect(value).toBe(1);
    });

    test('when called it returns undefined for a non-existing key', () => {
      // Prepare
      const cache = new LRUCache();

      // Act
      const value = cache.get('a');

      // Assess
      expect(value).toBeUndefined();
    });

    test('when called it marks the item as the most recently used', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);
      cache.add('b', 2);
      cache.add('c', 3);

      // Act
      cache.get('b');

      // Assess
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });
  });

  describe('Method: has', () => {
    test('when called it returns true for an existing key', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);

      // Act
      const hasKey = cache.has('a');

      // Assess
      expect(hasKey).toBe(true);
    });

    test('when called it returns false for a non-existing key', () => {
      // Prepare
      const cache = new LRUCache();

      // Act
      const hasKey = cache.has('a');

      // Assess
      expect(hasKey).toBe(false);
    });
  });

  describe('Method: remove', () => {
    test('when called it removes the item from the cache', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);
      cache.add('b', 2);
      cache.add('c', 3);

      // Act
      cache.remove('b');
      cache.remove('c');
      cache.remove('a');

      // Assess
      expect(cache.size()).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });

    test('when called on an empty cache it does nothing', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);
      cache.add('b', 2);

      // Act
      cache.remove('a');
      cache.remove('b');
      cache.remove('a');

      // Assess
      expect(cache.size()).toBe(0);
    });
  });
});

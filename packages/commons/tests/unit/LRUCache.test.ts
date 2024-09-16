import { describe, expect, it } from 'vitest';
import { LRUCache } from '../../src/LRUCache.js';

describe('Class: LRUMap', () => {
  describe('Method: add', () => {
    it('adds items to the cache', () => {
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

    it('updates the value of an existing key', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);

      // Act
      cache.add('a', 2);

      // Assess
      expect(cache.size()).toBe(1);
      expect(cache.get('a')).toBe(2);
    });

    it('removes the oldest item when the cache is full', () => {
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

    it('it skips the cache when max size is zero', () => {
      // Prepare
      const cache = new LRUCache({ maxSize: 0 });

      // Act
      cache.add('a', 1);

      // Assess
      expect(cache.size()).toBe(0);
    });
  });

  describe('Method: get', () => {
    it('returns the value of an existing key', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);

      // Act
      const value = cache.get('a');

      // Assess
      expect(value).toBe(1);
    });

    it('returns undefined for a non-existing key', () => {
      // Prepare
      const cache = new LRUCache();

      // Act
      const value = cache.get('a');

      // Assess
      expect(value).toBeUndefined();
    });
  });

  describe('Method: has', () => {
    it('returns true for an existing key', () => {
      // Prepare
      const cache = new LRUCache();
      cache.add('a', 1);

      // Act
      const hasKey = cache.has('a');

      // Assess
      expect(hasKey).toBe(true);
    });

    it('returns false for a non-existing key', () => {
      // Prepare
      const cache = new LRUCache();

      // Act
      const hasKey = cache.has('a');

      // Assess
      expect(hasKey).toBe(false);
    });
  });

  describe('Method: remove', () => {
    it('removes the item from the cache', () => {
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

    it('it does nothing when called on a non-existing key', () => {
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

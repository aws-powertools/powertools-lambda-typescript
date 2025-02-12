import { describe, expect, it, vi } from 'vitest';
import { CircularMap, SizedItem, SizedSet } from '../../src/logBuffer';

describe('SizedItem', () => {
  it('should calculate the byteSize based on JSON serialization', () => {
    // Prepare
    const logEntry = { message: 'hello world' };
    // Act
    const item = new SizedItem(logEntry, 1);
    // Assess
    const expectedByteSize = Buffer.byteLength(JSON.stringify(logEntry));
    expect(item.byteSize).toBe(expectedByteSize);
  });
});

describe('SizedSet', () => {
  it('should add an item and update currentBytesSize correctly', () => {
    // Prepare
    const set = new SizedSet<object>();
    const item = new SizedItem({ test: 'value' }, 1);
    // Act
    set.add(item);
    // Assess
    expect(set.currentBytesSize).toBe(item.byteSize);
    expect(set.has(item)).toBe(true);
  });

  it('should delete an item and update currentBytesSize correctly', () => {
    // Prepare
    const set = new SizedSet<object>();
    const item = new SizedItem({ test: 'value' }, 1);
    set.add(item);
    const initialSize = set.currentBytesSize;
    // Act
    const result = set.delete(item);
    // Assess
    expect(result).toBe(true);
    expect(set.currentBytesSize).toBe(initialSize - item.byteSize);
    expect(set.has(item)).toBe(false);
  });

  it('should clear all items and reset currentBytesSize to 0', () => {
    // Prepare
    const set = new SizedSet<object>();
    set.add(new SizedItem({ a: 'b' }, 1));
    set.add(new SizedItem({ c: 'd' }, 1));
    // Act
    set.clear();
    // Assess
    expect(set.currentBytesSize).toBe(0);
    expect(set.size).toBe(0);
  });

  it('should remove the first inserted item with shift', () => {
    // Prepare
    const set = new SizedSet<object>();
    const item1 = new SizedItem({ msg: 'first' }, 1);
    const item2 = new SizedItem({ msg: 'second' }, 1);
    set.add(item1);
    set.add(item2);
    // Act
    const shiftedItem = set.shift();
    // Assess
    expect(shiftedItem).toEqual(item1);
    expect(set.has(item1)).toBe(false);
    expect(set.currentBytesSize).toBe(item2.byteSize);
  });
});

describe('CircularMap', () => {
  it('should add items to a new buffer for a given key', () => {
    // Prepare
    const maxBytes = 200;
    const circularMap = new CircularMap<object>({
      maxBytesSize: maxBytes,
    });
    // Act
    circularMap.setItem('trace-1', { message: 'first log' }, 1);
    // Assess
    const buffer = circularMap.get('trace-1');
    expect(buffer).toBeDefined();
    if (buffer) {
      expect(buffer.currentBytesSize).toBeGreaterThan(0);
      expect(buffer.size).toBe(1);
    }
  });

  it('should throw an error when an item exceeds maxBytesSize', () => {
    // Prepare
    const maxBytes = 10;
    const circularMap = new CircularMap<object>({
      maxBytesSize: maxBytes,
    });
    // Act & Assess
    expect(() => {
      circularMap.setItem('trace-1', { message: 'a very long message' }, 1);
    }).toThrowError('Item too big');
  });

  it('should evict items when buffer overflows and call the overflow callback', () => {
    // Prepare
    let overflowCalled = false;
    const maxBytes = 100;
    const circularMap = new CircularMap<object>({
      maxBytesSize: maxBytes,
      onBufferOverflow: () => {
        overflowCalled = true;
      },
    });
    const smallEntry = { message: 'log' };
    const entryByteSize = Buffer.byteLength(JSON.stringify(smallEntry));
    const entriesCount = Math.ceil(maxBytes / entryByteSize) + 1;
    for (let i = 0; i < entriesCount; i++) {
      circularMap.setItem('trace-1', smallEntry, 1);
    }
    // Assess
    expect(overflowCalled).toBe(true);
    const buffer = circularMap.get('trace-1');
    if (buffer) {
      expect(buffer.currentBytesSize).toBeLessThan(maxBytes);
    }
  });
});

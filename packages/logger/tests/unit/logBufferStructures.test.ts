import { describe, expect, it, vi } from 'vitest';

import { CircularMap, SizedItem, SizedSet } from '../../src/logBuffer.js';

describe('SizedItem', () => {
  it('calculates the byteSize based on string value', () => {
    // Prepare
    const logEntry = 'hello world';

    // Act
    const item = new SizedItem(logEntry, 1);

    // Assess
    const expectedByteSize = Buffer.byteLength(logEntry);
    expect(item.byteSize).toBe(expectedByteSize);
  });

  it('throws an error if value is not a string', () => {
    // Prepare
    const invalidValue = { message: 'not a string' };

    // Act & Assess
    expect(
      () => new SizedItem(invalidValue as unknown as string, 1)
    ).toThrowError('Value should be a string');
  });
});

describe('SizedSet', () => {
  it('adds an item and updates currentBytesSize correctly', () => {
    // Prepare
    const set = new SizedSet<string>();
    const item = new SizedItem('value', 1);

    // Act
    set.add(item);

    // Assess
    expect(set.currentBytesSize).toBe(item.byteSize);
    expect(set.has(item)).toBe(true);
  });

  it('deletes an item and updates currentBytesSize correctly', () => {
    // Prepare
    const set = new SizedSet<string>();
    const item = new SizedItem('value', 1);
    set.add(item);
    const initialSize = set.currentBytesSize;

    // Act
    const result = set.delete(item);

    // Assess
    expect(result).toBe(true);
    expect(set.currentBytesSize).toBe(initialSize - item.byteSize);
    expect(set.has(item)).toBe(false);
  });

  it('clears all items and resets currentBytesSize to 0', () => {
    // Prepare
    const set = new SizedSet<string>();
    set.add(new SizedItem('b', 1));
    set.add(new SizedItem('d', 1));

    // Act
    set.clear();

    // Assess
    expect(set.currentBytesSize).toBe(0);
    expect(set.size).toBe(0);
  });

  it('removes the first inserted item with shift', () => {
    // Prepare
    const set = new SizedSet<string>();
    const item1 = new SizedItem('first', 1);
    const item2 = new SizedItem('second', 1);
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
  it('adds items to a new buffer for a given key', () => {
    // Prepare
    const maxBytes = 200;
    const circularMap = new CircularMap<string>({
      maxBytesSize: maxBytes,
    });

    // Act
    circularMap.setItem('trace-1', 'first log', 1);

    // Assess
    const buffer = circularMap.get('trace-1');
    expect(buffer).toBeDefined();
    if (buffer) {
      expect(buffer.currentBytesSize).toBeGreaterThan(0);
      expect(buffer.size).toBe(1);
    }
  });

  it('throws an error when an item exceeds maxBytesSize', () => {
    // Prepare
    const maxBytes = 10;
    const circularMap = new CircularMap<string>({
      maxBytesSize: maxBytes,
    });

    // Act & Assess
    expect(() => {
      circularMap.setItem('trace-1', 'a very long message', 1);
    }).toThrowError('Item too big');
  });

  it('evicts items when the buffer overflows and call the overflow callback', () => {
    // Prepare
    const options = {
      maxBytesSize: 15,
      onBufferOverflow: vi.fn(),
    };
    const circularMap = new CircularMap<string>(options);
    const smallEntry = '12345';

    const entryByteSize = Buffer.byteLength(smallEntry);
    const entriesCount = Math.ceil(options.maxBytesSize / entryByteSize);

    // Act
    for (let i = 0; i < entriesCount; i++) {
      circularMap.setItem('trace-1', smallEntry, 1);
    }

    // Assess
    expect(options.onBufferOverflow).toHaveBeenCalledTimes(1);
    expect(circularMap.get('trace-1')?.currentBytesSize).toBeLessThan(
      options.maxBytesSize
    );
  });
});

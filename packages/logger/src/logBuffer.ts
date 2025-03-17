import { isString } from '@aws-lambda-powertools/commons/typeutils';

/**
 * A data structure that holds a value and its byte size.
 *
 * @internal
 */
export class SizedItem<V> {
  public value: V;
  public logLevel: number;
  public byteSize: number;

  constructor(value: V, logLevel: number) {
    if (!isString(value)) {
      throw new Error('Value should be a string');
    }
    this.value = value;
    this.logLevel = logLevel;
    this.byteSize = Buffer.byteLength(value as unknown as string);
  }
}

/**
 * A set that tracks its current byte size.
 *
 * @internal
 */
export class SizedSet<V> extends Set<SizedItem<V>> {
  public currentBytesSize = 0;
  public hasEvictedLog = false;

  /**
   * Adds an item to the set and updates the current byte size.
   *
   * @param item - The item to add
   */
  add(item: SizedItem<V>): this {
    this.currentBytesSize += item.byteSize;
    super.add(item);
    return this;
  }

  /**
   * Deletes an item from the set and updates the current byte size.
   *
   * @param item - The item to delete
   */
  delete(item: SizedItem<V>): boolean {
    const wasDeleted = super.delete(item);
    if (wasDeleted) {
      this.currentBytesSize -= item.byteSize;
    }
    return wasDeleted;
  }

  /**
   * Clears all items from the set and resets the current byte size.
   */
  clear(): void {
    super.clear();
    this.currentBytesSize = 0;
  }

  /**
   * Removes the first item from the set and returns it.
   */
  shift(): SizedItem<V> | undefined {
    const firstElement = this.values().next().value;
    if (firstElement) {
      this.delete(firstElement);
    }
    return firstElement;
  }
}

/**
 * A ring buffer that stores logs in a circular manner.
 *
 * @internal
 */
export class CircularMap<V> extends Map<string, SizedSet<V>> {
  readonly #maxBytesSize: number;
  readonly #onBufferOverflow?: () => void;

  constructor({
    maxBytesSize,
    onBufferOverflow,
  }: {
    maxBytesSize: number;
    onBufferOverflow?: () => void;
  }) {
    super();
    this.#maxBytesSize = maxBytesSize;
    this.#onBufferOverflow = onBufferOverflow;
  }

  /**
   * Adds an item to the buffer, evicting older items if necessary.
   *
   * @param key - The key to associate with the item
   * @param value - The item to add
   * @param logLevel - The log level of the item
   */
  setItem(key: string, value: V, logLevel: number): this {
    const item = new SizedItem<V>(value, logLevel);

    if (item.byteSize > this.#maxBytesSize) {
      throw new Error('Item too big');
    }

    const buffer = this.get(key) || new SizedSet<V>();

    if (buffer.currentBytesSize + item.byteSize >= this.#maxBytesSize) {
      this.#deleteFromBufferUntilSizeIsLessThanMax(buffer, item);
      if (this.#onBufferOverflow) {
        this.#onBufferOverflow();
      }
    }

    buffer.add(item);
    super.set(key, buffer);
    return this;
  }

  /**
   * Deletes an item from the buffer.
   *
   * @param key - The key associated with the item
   * @param value - The item to delete
   */
  #deleteFromBufferUntilSizeIsLessThanMax(
    buffer: SizedSet<V>,
    item: SizedItem<V>
  ) {
    while (buffer.currentBytesSize + item.byteSize >= this.#maxBytesSize) {
      buffer.shift();
      buffer.hasEvictedLog = true;
    }
  }
}

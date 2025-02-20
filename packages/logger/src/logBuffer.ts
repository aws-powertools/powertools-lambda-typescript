import { isString } from '@aws-lambda-powertools/commons/typeutils';

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

export class SizedSet<V> extends Set<SizedItem<V>> {
  public currentBytesSize = 0;
  public evictedLogCount = 0;

  add(item: SizedItem<V>): this {
    this.currentBytesSize += item.byteSize;
    super.add(item);
    return this;
  }

  delete(item: SizedItem<V>): boolean {
    const wasDeleted = super.delete(item);
    if (wasDeleted) {
      this.currentBytesSize -= item.byteSize;
    }
    return wasDeleted;
  }

  clear(): void {
    super.clear();
    this.currentBytesSize = 0;
  }

  shift(): SizedItem<V> | undefined {
    const firstElement = this.values().next().value;
    if (firstElement) {
      this.delete(firstElement);
    }
    return firstElement;
  }
}

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

  readonly #deleteFromBufferUntilSizeIsLessThanMax = (
    buffer: SizedSet<V>,
    item: SizedItem<V>
  ) => {
    while (buffer.currentBytesSize + item.byteSize >= this.#maxBytesSize) {
      buffer.shift();
      buffer.evictedLogCount++;
    }
  };
}

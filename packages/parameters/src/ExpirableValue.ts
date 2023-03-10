import type { ExpirableValueInterface } from './types';

class ExpirableValue implements ExpirableValueInterface {
  public ttl: number;
  public value: string | Uint8Array | Record<string, unknown>;

  /**
   * Creates a new cached value which will expire automatically
   * @param value Parameter value to be cached
   * @param maxAge Maximum number of seconds to cache the value for
   */
  public constructor(value: string | Uint8Array | Record<string, unknown>, maxAge: number) {
    this.value = value;

    const maxAgeInMilliseconds = maxAge * 1000;
    const nowTimestamp = Date.now();
    this.ttl = nowTimestamp + maxAgeInMilliseconds;
  }

  public isExpired(): boolean {
    return this.ttl < Date.now();
  }
}

export {
  ExpirableValue
};
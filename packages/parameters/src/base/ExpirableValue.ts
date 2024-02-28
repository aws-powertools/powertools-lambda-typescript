import type { ExpirableValueInterface } from '../types/BaseProvider.js';

/**
 * Class to represent a value that can expire.
 *
 * Upon creation, the value is assigned a TTL (time to live) that is calculated
 * by adding the current time with the maximum age.
 */
class ExpirableValue implements ExpirableValueInterface {
  public ttl: number;
  public value: unknown;

  /**
   *
   * @param value - Value to be cached
   * @param maxAge - Maximum age in seconds for the value to be cached
   */
  public constructor(value: unknown, maxAge: number) {
    this.value = value;
    const timeNow = new Date();
    this.ttl = timeNow.setSeconds(timeNow.getSeconds() + maxAge);
  }

  /**
   * Check if the value has expired.
   *
   * @returns {boolean} - True if the value has expired, false otherwise
   */
  public isExpired(): boolean {
    return this.ttl < Date.now();
  }
}

export { ExpirableValue };

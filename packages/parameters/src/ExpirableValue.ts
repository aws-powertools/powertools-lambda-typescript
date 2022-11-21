import type { ExpirableValueInterface } from './types';

class ExpirableValue implements ExpirableValueInterface {
  public ttl: number;
  public value: string | Record<string, unknown>;

  public constructor(value: string | Record<string, unknown>, maxAge: number) {
    this.value = value;
    const timeNow = new Date();
    this.ttl = timeNow.setSeconds(timeNow.getSeconds() + maxAge);
  }

  public isExpired(): boolean {
    return this.ttl < Date.now();
  }
}

export { 
  ExpirableValue
};
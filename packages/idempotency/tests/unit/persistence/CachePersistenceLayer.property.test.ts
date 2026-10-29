import fc from 'fast-check';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { IdempotencyRecordStatus } from '../../../src/constants.js';
import { IdempotencyConfig } from '../../../src/IdempotencyConfig.js';
import { IdempotencyRecord } from '../../../src/persistence/IdempotencyRecord.js';
import type { CacheClient } from '../../../src/types/CachePersistence.js';
import { CachePersistenceLayerTestClass } from '../../helpers/idempotencyUtils.js';

const TICK_MS = 1_000;
const LAMBDA_TIMEOUT_MS = 3 * TICK_MS;
const EXPIRES_AFTER_SECONDS = 6;
const EPOCH = 1_700_000_000_000;

type SetOptions = { NX?: boolean; PX?: number; EX?: number };

/**
 * In-memory store with the cache semantics the adapter relies on: `SET NX`
 * is atomic and keys disappear once their TTL elapses.
 */
class FakeStore {
  readonly #entries = new Map<string, { value: string; expiresAt: number }>();

  get(key: string): string | null {
    const entry = this.#entries.get(key);
    if (entry === undefined || entry.expiresAt <= Date.now()) {
      this.#entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: string, options: SetOptions): 'OK' | null {
    if (options.NX && this.get(key) !== null) return null;
    this.#entries.set(key, {
      value,
      expiresAt: Date.now() + (options.PX ?? (options.EX ?? 0) * 1000),
    });
    return 'OK';
  }

  del(keys: string[]): number {
    let deleted = 0;
    for (const key of keys) deleted += this.#entries.delete(key) ? 1 : 0;
    return deleted;
  }
}

type Outcome = 'succeed' | 'fail';
type Event = { kind: 'tick' } | { kind: 'step'; caller: number };

/**
 * Drives callers through the real adapter one client round trip at a time.
 * Requests execute immediately; every response waits for a `step` event for
 * its caller, so the generated schedule fully determines the interleaving,
 * including responses that arrive after the world has moved on.
 */
class Harness {
  readonly store = new FakeStore();
  readonly owners = new Map<string, number>();
  clobbered = false;
  readonly #gates = new Map<number, () => void>();
  readonly #deadline: number[] = [];
  readonly #state: Array<
    'idle' | 'acquiring' | 'executing' | 'completing' | 'done' | 'rejected'
  > = [];
  readonly #event = { id: 'order-1' };

  constructor(private readonly outcomes: Outcome[]) {
    for (let i = 0; i < outcomes.length; i++) {
      this.#deadline.push(Number.POSITIVE_INFINITY);
      this.#state.push('idle');
    }
  }

  alive(caller: number): boolean {
    return (
      this.#state[caller] !== 'idle' && Date.now() < this.#deadline[caller]
    );
  }

  executingAndAlive(): number {
    return this.outcomes.filter(
      (_, caller) => this.#state[caller] === 'executing' && this.alive(caller)
    ).length;
  }

  async apply(event: Event): Promise<void> {
    if (event.kind === 'tick') {
      vi.setSystemTime(Date.now() + TICK_MS);
    } else if (this.#state[event.caller] === 'idle') {
      void this.#run(event.caller);
    } else if (this.alive(event.caller)) {
      const release = this.#gates.get(event.caller);
      this.#gates.delete(event.caller);
      release?.();
    }
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  }

  #gate(caller: number): Promise<void> {
    return new Promise((resolve) => this.#gates.set(caller, resolve));
  }

  #client(caller: number): CacheClient {
    const roundTrip = async <T>(operation: () => T): Promise<T> => {
      const result = operation();
      await this.#gate(caller);
      return result;
    };
    return {
      get: (key) => roundTrip(() => this.store.get(key)),
      set: (name, value, options) =>
        roundTrip(() => {
          const key = name as string;
          const opts = options as SetOptions;
          if (opts.NX && this.store.get(key) !== null) return null;
          this.#checkClobber(key, caller);
          this.owners.set(
            key,
            opts.NX ? caller : (this.owners.get(key) ?? caller)
          );
          return this.store.set(key, value as string, opts);
        }),
      del: (keys) =>
        roundTrip(() => {
          for (const key of keys) this.#checkClobber(key, caller);
          return this.store.del(keys);
        }),
    };
  }

  /** A write over a valid result, or over the lock of a live caller, is a clobber. */
  #checkClobber(key: string, caller: number): void {
    const current = this.store.get(key);
    if (current === null) return;
    const record = JSON.parse(current) as { status: string };
    const owner = this.owners.get(key);
    if (record.status === IdempotencyRecordStatus.COMPLETED) {
      this.clobbered = true;
    } else if (owner !== undefined && owner !== caller && this.alive(owner)) {
      this.clobbered = true;
    }
  }

  async #run(caller: number): Promise<void> {
    const layer = new CachePersistenceLayerTestClass({
      client: this.#client(caller),
    });
    layer.configure({
      config: new IdempotencyConfig({
        expiresAfterSeconds: EXPIRES_AFTER_SECONDS,
      }),
      keyPrefix: 'property',
    });
    this.#deadline[caller] = Date.now() + LAMBDA_TIMEOUT_MS;
    this.#state[caller] = 'acquiring';
    try {
      await layer.saveInProgress(this.#event, LAMBDA_TIMEOUT_MS);
    } catch {
      this.#state[caller] = 'rejected';
      return;
    }
    // the wrapped function runs for one step
    this.#state[caller] = 'executing';
    await this.#gate(caller);
    this.#state[caller] = 'completing';
    if (this.outcomes[caller] === 'fail') {
      await layer.deleteRecord(this.#event);
    } else {
      await layer.saveSuccess(this.#event, { caller });
    }
    this.#state[caller] = 'done';
  }
}

const eventArb = (callers: number): fc.Arbitrary<Event> =>
  fc.oneof(
    { weight: 2, arbitrary: fc.constant<Event>({ kind: 'tick' }) },
    {
      weight: 5,
      arbitrary: fc.record({
        kind: fc.constant<'step'>('step'),
        caller: fc.integer({ min: 0, max: callers - 1 }),
      }),
    }
  );

describe('CachePersistenceLayer property tests', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('never lets two live callers hold the record or destroy a valid one', async () => {
    const scenarioArb = fc
      .array(fc.constantFrom<Outcome>('succeed', 'fail'), {
        minLength: 2,
        maxLength: 3,
      })
      .chain((outcomes) =>
        fc.tuple(
          fc.constant(outcomes),
          fc.array(eventArb(outcomes.length), {
            minLength: 10,
            maxLength: 60,
            size: 'max',
          })
        )
      );

    await fc.assert(
      fc.asyncProperty(scenarioArb, async ([outcomes, events]) => {
        vi.setSystemTime(EPOCH);
        const harness = new Harness(outcomes);
        for (const event of events) {
          await harness.apply(event);
          expect(harness.executingAndAlive()).toBeLessThanOrEqual(1);
          expect(harness.clobbered).toBe(false);
        }
      }),
      { numRuns: 1_000 }
    );
  });

  it('keeps an in progress record until its deadline and never past its expiry', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 999 }),
        fc.integer({ min: 1, max: 3_600 }),
        fc.option(fc.integer({ min: -1_000, max: 900_000 }), {
          nil: undefined,
        }),
        async (clockMs, expiresInSeconds, remainingMs) => {
          // Prepare
          vi.setSystemTime(EPOCH + clockMs);
          const set = vi.fn().mockResolvedValue('OK');
          const layer = new CachePersistenceLayerTestClass({
            client: { get: vi.fn(), set, del: vi.fn() },
          });
          const now = Date.now();
          const expiryTimestamp = Math.floor(now / 1000) + expiresInSeconds;
          const deadline =
            remainingMs === undefined ? undefined : now + remainingMs;
          const record = new IdempotencyRecord({
            idempotencyKey: 'key',
            status: IdempotencyRecordStatus.INPROGRESS,
            expiryTimestamp,
            inProgressExpiryTimestamp: deadline,
          });

          // Act
          await layer._putRecord(record);

          // Assess
          const { EX, expiry } = set.mock.calls[0][2] as SetOptions & {
            expiry: { count: number };
          };
          const removedAt = now + (EX as number) * 1000;
          expect(EX).toBeGreaterThanOrEqual(1);
          expect(expiry.count).toBe(EX);
          if (EX !== 1) {
            expect(removedAt).toBeLessThanOrEqual(expiryTimestamp * 1000);
          }
          if (
            deadline !== undefined &&
            deadline > now &&
            deadline <= expiryTimestamp * 1000
          ) {
            expect(removedAt).toBeGreaterThanOrEqual(deadline);
            expect(removedAt).toBeLessThan(deadline + 1000);
          }
        }
      ),
      { numRuns: 500 }
    );
  });

  it('never keeps a completed record past its expiry', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 999 }),
        fc.integer({ min: 2, max: 3_600 }),
        async (clockMs, expiresInSeconds) => {
          // Prepare
          vi.setSystemTime(EPOCH + clockMs);
          const set = vi.fn().mockResolvedValue('OK');
          const layer = new CachePersistenceLayerTestClass({
            client: { get: vi.fn(), set, del: vi.fn() },
          });
          const now = Date.now();
          const expiryTimestamp = Math.floor(now / 1000) + expiresInSeconds;
          const record = new IdempotencyRecord({
            idempotencyKey: 'key',
            status: IdempotencyRecordStatus.COMPLETED,
            expiryTimestamp,
            responseData: { ok: true },
          });

          // Act
          await layer._updateRecord(record);

          // Assess
          const { EX } = set.mock.calls[0][2] as SetOptions;
          const removedAt = now + (EX as number) * 1000;
          expect(removedAt).toBeLessThanOrEqual(expiryTimestamp * 1000);
          expect(removedAt).toBeGreaterThan(expiryTimestamp * 1000 - 1000);
        }
      ),
      { numRuns: 500 }
    );
  });
});

import type { InvokeStoreBase } from '@aws/lambda-invoke-store';
import '@aws/lambda-invoke-store';
import { shouldUseInvokeStore } from './envUtils.js';
import type { InvocationScopedOptions } from './types/InvocationScoped.js';

/**
 * A value wrapped in a single-element array, so that a slot holding no value at
 * all is told apart from one holding a value that is itself `undefined`.
 *
 * Neither the InvokeStore nor a class field can express "empty" other than as
 * `undefined`, which is itself a legitimate value to store: a Lambda context
 * that has never been set has to read differently from one deliberately
 * cleared.
 *
 * @typeParam T - The type of the value being wrapped
 */
type Box<T> = [T];

/**
 * Holds a value scoped to a single invocation when invocations may run
 * concurrently in the same execution environment, and shared across
 * invocations otherwise.
 *
 * The storage is resolved on every access rather than once at construction,
 * so a value created during initialization keeps working once an invocation
 * context exists. Reads and writes are scoped to the invocation only when the
 * `AWS_LAMBDA_MAX_CONCURRENCY` environment variable is set, the RIC exposes an
 * `InvokeStore`, and an invocation context is active; in every other case they
 * fall through to the shared value, which is also what
 * {@link InvocationScoped.getShared | `getShared()`} and
 * {@link InvocationScoped.setShared | `setShared()`} always operate on.
 *
 * Values are handed out by reference: a caller that retains the value can
 * mutate it, so containers meant to stay per-invocation should not be passed
 * outside the invocation that owns them.
 *
 * @example
 * ```ts
 * import { InvocationScoped } from '@aws-lambda-powertools/commons/utils/invocation-scoped';
 *
 * // A value with a shared default that invocations can override
 * const logLevel = new InvocationScoped<number>('powertools.logger.logLevel', {
 *   initial: 12,
 * });
 * logLevel.set(8); // only this invocation logs at DEBUG
 *
 * // A container created anew for each invocation
 * const attributes = new InvocationScoped<Record<string, unknown>>(
 *   'powertools.logger.temporaryAttributes',
 *   { fresh: () => ({}) }
 * );
 * attributes.get().foo = 'bar';
 * ```
 *
 * @typeParam T - The type of the value being held
 *
 * @internal
 */
class InvocationScoped<T> {
  /**
   * Key the boxed value is stored under in the InvokeStore, unique to this
   * instance.
   */
  readonly #key: symbol;
  /**
   * Creates the value, either by calling the `fresh` factory or by handing back
   * the `initial` value.
   */
  readonly #createValue: () => T;
  /**
   * Whether each invocation gets its own value created for it (`fresh`) instead
   * of falling back to the shared one (`initial`).
   */
  readonly #createsPerInvocation: boolean;
  /**
   * The value shared across invocations, boxed like the invocation-scoped one.
   */
  #sharedValue: Box<T> | undefined;

  /**
   * @param name - Description of the value, used for the storage key, e.g. `powertools.logger.logLevel`
   * @param {Object} options - Options to create the value
   * @param options.initial - Value shared across invocations until one sets its own
   * @param options.fresh - Creates the value, called once per invocation on first access, and once for the shared value
   */
  public constructor(name: string, options: InvocationScopedOptions<T>) {
    this.#key = Symbol(name);
    if ('fresh' in options) {
      this.#createValue = options.fresh;
      this.#createsPerInvocation = true;
    } else {
      const { initial } = options;
      this.#createValue = () => initial;
      this.#createsPerInvocation = false;
    }
  }

  /**
   * Whether reads and writes are currently scoped to a single invocation.
   */
  public get isScoped(): boolean {
    return this.#getScopedStore() !== undefined;
  }

  /**
   * Gets the invocation-scoped value when there is one, otherwise the shared
   * value.
   *
   * A `fresh` value is created on first access, and the same one is handed back
   * for the rest of the invocation.
   */
  public get(): T {
    const store = this.#getScopedStore();
    if (store === undefined) {
      return this.getShared();
    }

    const scopedValue = store.get<Box<T>>(this.#key);
    if (scopedValue !== undefined) {
      return scopedValue[0];
    }
    if (!this.#createsPerInvocation) {
      return this.getShared();
    }

    const freshValue = this.#createValue();
    store.set(this.#key, [freshValue]);

    return freshValue;
  }

  /**
   * Sets the value for the current invocation, or the shared value when no
   * invocation context is active, i.e. during initialization.
   *
   * `undefined` is a value like any other: it shadows the shared value until
   * {@link InvocationScoped.reset | `reset()`} discards it.
   *
   * @param value - The value to store
   */
  public set(value: T): void {
    const store = this.#getScopedStore();
    if (store === undefined) {
      this.setShared(value);
      return;
    }
    store.set(this.#key, [value]);
  }

  /**
   * Discards the value, so that a `fresh` one is created on the next access and
   * an `initial` one goes back to the shared value.
   *
   * Outside an invocation context the shared value is discarded instead, which
   * puts an `initial` value back to the one given at construction.
   */
  public reset(): void {
    const store = this.#getScopedStore();
    if (store === undefined) {
      this.#sharedValue = undefined;
      return;
    }
    // The InvokeStore has no way to remove a key, so an empty slot is
    // represented by the absence of a box, which reads fall back from.
    store.set(this.#key, undefined);
  }

  /**
   * Gets the value shared across invocations, ignoring any invocation context.
   *
   * It is created on first access, whether from here or from
   * {@link InvocationScoped.get | `get()`}.
   */
  public getShared(): T {
    this.#sharedValue ??= [this.#createValue()];

    return this.#sharedValue[0];
  }

  /**
   * Sets the value shared across invocations, ignoring any invocation context.
   *
   * @param value - The value to store
   */
  public setShared(value: T): void {
    this.#sharedValue = [value];
  }

  /**
   * Gets the InvokeStore when reads and writes should be scoped to the current
   * invocation, or `undefined` when they should go to the shared value.
   */
  #getScopedStore(): InvokeStoreBase | undefined {
    if (!shouldUseInvokeStore()) {
      return undefined;
    }

    const store = globalThis.awslambda?.InvokeStore;
    if (store === undefined) {
      throw new Error('InvokeStore is not available');
    }

    return store.hasContext() ? store : undefined;
  }
}

export { InvocationScoped };

import '@aws/lambda-invoke-store';
import { shouldUseInvokeStore } from '@aws-lambda-powertools/commons/utils/env';
import { CircularMap, type SizedSet } from './logBuffer.js';

/**
 * Manages per-invocation log state with automatic context detection.
 *
 * This class abstracts the storage mechanism for state that must be scoped to
 * a single invocation, automatically choosing between the InvokeStore (when
 * invocations run concurrently in the same execution environment) and an
 * instance-level fallback shared across sequential invocations. The decision
 * is made at runtime on every access to support Lambda's transition to async
 * contexts.
 *
 * It holds:
 * - the effective log level, so per-invocation changes like the debug sampling
 *   decision don't leak across concurrent invocations, with the base level as
 *   the fallback;
 * - the log buffer, grouped by `_X_AMZN_TRACE_ID` with each group capped at
 *   `maxBytes` (only after {@link LogInvocationStore.configureBuffer | `configureBuffer()`}).
 */
class LogInvocationStore {
  readonly #logLevelKey = Symbol('powertools.logger.logLevel');
  readonly #bufferKey = Symbol('powertools.logger.buffer');
  #baseLogLevel: number;
  #maxBytes!: number;
  #fallbackBuffer!: CircularMap<string>;

  public constructor(logLevel: number) {
    this.#baseLogLevel = logLevel;
  }

  /**
   * Get the log level in effect: the per-invocation level when one has been
   * set, otherwise the base level.
   */
  public getLogLevel(): number {
    if (!shouldUseInvokeStore()) {
      return this.#baseLogLevel;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    return (
      (globalThis.awslambda.InvokeStore.get(this.#logLevelKey) as
        | number
        | undefined) ?? this.#baseLogLevel
    );
  }

  /**
   * Get the base log level shared across invocations, without consulting the
   * InvokeStore.
   */
  public getBaseLogLevel(): number {
    return this.#baseLogLevel;
  }

  /**
   * Set the log level, scoping it to the current invocation when concurrency
   * is enabled and an invocation context is active. Outside an invocation
   * context (e.g. during initialization) the base level is set instead.
   */
  public setLogLevel(logLevel: number): void {
    if (shouldUseInvokeStore()) {
      if (globalThis.awslambda?.InvokeStore === undefined) {
        throw new Error('InvokeStore is not available');
      }

      const store = globalThis.awslambda.InvokeStore;
      if (store.hasContext()) {
        store.set(this.#logLevelKey, logLevel);
        return;
      }
    }
    this.#baseLogLevel = logLevel;
  }

  /**
   * Set the base log level shared across invocations, regardless of any active
   * invocation context. Used at initialization and for Advanced Logging
   * Controls, which apply environment-wide.
   */
  public setBaseLogLevel(logLevel: number): void {
    this.#baseLogLevel = logLevel;
  }

  /**
   * Enable the log buffer with the given max byte size per trace id.
   *
   * Must be called before any buffer operation; the buffer methods are only
   * reached when buffering is enabled.
   *
   * @param maxBytes - Max byte size of each trace id's buffer
   */
  public configureBuffer(maxBytes: number): void {
    this.#maxBytes = maxBytes;
    this.#fallbackBuffer = new CircularMap({ maxBytesSize: maxBytes });
  }

  #getBuffer(): CircularMap<string> {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackBuffer;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    let buffer = store.get(this.#bufferKey) as CircularMap<string> | undefined;
    if (buffer == null) {
      buffer = new CircularMap({ maxBytesSize: this.#maxBytes });
      store.set(this.#bufferKey, buffer);
    }
    return buffer;
  }

  /**
   * Add a log to the buffer for the given trace id.
   *
   * @param traceId - `_X_AMZN_TRACE_ID` of the request
   * @param value - The serialized log to be buffered
   * @param logLevel - The level of the log to be buffered
   */
  public add(traceId: string, value: string, logLevel: number): void {
    const buffer = this.#getBuffer();
    // When invocations run sequentially, seeing a new trace id means the
    // previous request is done, so its leftover entries are cleared to avoid
    // retaining stale logs. Under concurrency the buffer is scoped to the
    // invocation via the InvokeStore, so no cleanup is needed and clearing
    // would wipe other in-flight invocations' logs.
    if (!shouldUseInvokeStore() && buffer.has(traceId) === false) {
      buffer.clear();
    }
    buffer.setItem(traceId, value, logLevel);
  }

  /**
   * Get the buffered logs for the given trace id, if any.
   *
   * @param traceId - `_X_AMZN_TRACE_ID` of the request
   */
  public get(traceId: string): SizedSet<string> | undefined {
    return this.#getBuffer().get(traceId);
  }

  /**
   * Empty the buffer for the given trace id.
   *
   * @param traceId - `_X_AMZN_TRACE_ID` of the request
   */
  public delete(traceId: string): void {
    this.#getBuffer().delete(traceId);
  }
}

export { LogInvocationStore };

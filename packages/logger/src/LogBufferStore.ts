import '@aws/lambda-invoke-store';
import { shouldUseInvokeStore } from '@aws-lambda-powertools/commons/utils/env';
import { CircularMap, type SizedSet } from './logBuffer.js';

/**
 * Manages storage of buffered logs with automatic context detection.
 *
 * This class abstracts the storage mechanism for the log buffer, automatically
 * choosing between the InvokeStore (when invocations run concurrently in the
 * same execution environment) and an instance-level buffer shared across
 * sequential invocations. The decision is made at runtime on every access to
 * support Lambda's transition to async contexts.
 *
 * Buffered logs are grouped by `_X_AMZN_TRACE_ID`, each group with a max size
 * of `maxBytes`.
 */
class LogBufferStore {
  readonly #bufferKey = Symbol('powertools.logger.buffer');
  readonly #maxBytes: number;
  readonly #fallbackBuffer: CircularMap<string>;

  public constructor(maxBytes: number) {
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

export { LogBufferStore };

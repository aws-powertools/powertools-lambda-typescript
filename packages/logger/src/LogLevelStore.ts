import '@aws/lambda-invoke-store';
import { shouldUseInvokeStore } from '@aws-lambda-powertools/commons/utils/env';

/**
 * Manages the log level with automatic context detection.
 *
 * This class abstracts the storage of the effective log level, automatically
 * choosing between the InvokeStore (when invocations run concurrently in the
 * same execution environment) and a base level shared across sequential
 * invocations. The decision is made at runtime on every access to support
 * Lambda's transition to async contexts.
 *
 * Per-invocation changes such as the debug sampling decision are scoped to the
 * invocation, while the base level (set at initialization or via Advanced
 * Logging Controls) is the fallback.
 */
class LogLevelStore {
  readonly #logLevelKey = Symbol('powertools.logger.logLevel');
  #baseLogLevel: number;

  public constructor(logLevel: number) {
    this.#baseLogLevel = logLevel;
  }

  /**
   * Get the log level in effect: the per-invocation level when one has been
   * set, otherwise the base level.
   */
  public get(): number {
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
  public getBase(): number {
    return this.#baseLogLevel;
  }

  /**
   * Set the log level, scoping it to the current invocation when concurrency
   * is enabled and an invocation context is active. Outside an invocation
   * context (e.g. during initialization) the base level is set instead.
   */
  public set(logLevel: number): void {
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
  public setBase(logLevel: number): void {
    this.#baseLogLevel = logLevel;
  }
}

export { LogLevelStore };

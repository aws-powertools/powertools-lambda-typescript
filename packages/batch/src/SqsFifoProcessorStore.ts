import '@aws/lambda-invoke-store';
import { shouldUseInvokeStore } from '@aws-lambda-powertools/commons/utils/env';

/**
 * Manages storage of SQS FIFO processor state with automatic context detection.
 *
 * This class abstracts the storage mechanism for SQS FIFO processing state,
 * automatically choosing between InvokeStore (when in Lambda context) and
 * fallback instance variables (when outside Lambda context). The decision is
 * made at runtime on every method call to support Lambda's concurrent execution
 * isolation.
 */
class SqsFifoProcessorStore {
  readonly #currentGroupIdKey = Symbol(
    'powertools.batch.sqsFifo.currentGroupId'
  );
  readonly #failedGroupIdsKey = Symbol(
    'powertools.batch.sqsFifo.failedGroupIds'
  );

  #fallbackCurrentGroupId?: string;
  #fallbackFailedGroupIds = new Set<string>();

  public getCurrentGroupId(): string | undefined {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackCurrentGroupId;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    return store.get(this.#currentGroupIdKey) as string | undefined;
  }

  public setCurrentGroupId(groupId: string | undefined): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackCurrentGroupId = groupId;
      return;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    store.set(this.#currentGroupIdKey, groupId);
  }

  public addFailedGroupId(groupId: string): void {
    this.getFailedGroupIds().add(groupId);
  }

  public hasFailedGroupId(groupId: string): boolean {
    return this.getFailedGroupIds().has(groupId);
  }

  public getFailedGroupIds(): Set<string> {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackFailedGroupIds;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    let failedGroupIds = store.get(this.#failedGroupIdsKey) as
      | Set<string>
      | undefined;
    if (failedGroupIds == null) {
      failedGroupIds = new Set<string>();
      store.set(this.#failedGroupIdsKey, failedGroupIds);
    }

    return failedGroupIds;
  }

  public clearFailedGroupIds(): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackFailedGroupIds = new Set<string>();
      return;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    store.set(this.#failedGroupIdsKey, new Set<string>());
  }
}

export { SqsFifoProcessorStore };

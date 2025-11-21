import '@aws/lambda-invoke-store';

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
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackCurrentGroupId;
    }

    return invokeStore.get(this.#currentGroupIdKey) as string | undefined;
  }

  public setCurrentGroupId(groupId: string | undefined): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackCurrentGroupId = groupId;
      return;
    }

    invokeStore.set(this.#currentGroupIdKey, groupId);
  }

  public addFailedGroupId(groupId: string): void {
    this.getFailedGroupIds().add(groupId);
  }

  public hasFailedGroupId(groupId: string): boolean {
    return this.getFailedGroupIds().has(groupId);
  }

  public getFailedGroupIds(): Set<string> {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackFailedGroupIds;
    }

    let failedGroupIds = invokeStore.get(this.#failedGroupIdsKey) as
      | Set<string>
      | undefined;
    if (failedGroupIds == null) {
      failedGroupIds = new Set<string>();
      invokeStore.set(this.#failedGroupIdsKey, failedGroupIds);
    }

    return failedGroupIds;
  }

  public clearFailedGroupIds(): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackFailedGroupIds = new Set<string>();
      return;
    }

    invokeStore.set(this.#failedGroupIdsKey, new Set<string>());
  }
}

export { SqsFifoProcessorStore };

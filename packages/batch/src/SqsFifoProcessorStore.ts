import { InvocationScoped } from '@aws-lambda-powertools/commons/utils/invocation-scoped';

/**
 * Manages storage of SQS FIFO processor state with automatic context detection.
 *
 * This class abstracts the storage mechanism for state that must be scoped to
 * a single invocation, automatically choosing between the InvokeStore (when
 * invocations run concurrently in the same execution environment) and an
 * instance-level fallback shared across sequential invocations. The decision
 * is made at runtime on every access to support Lambda's transition to async
 * contexts.
 */
class SqsFifoProcessorStore {
  readonly #currentGroupId = new InvocationScoped<string | undefined>(
    'powertools.batch.sqsFifo.currentGroupId',
    { initial: undefined }
  );
  readonly #failedGroupIds = new InvocationScoped<Set<string>>(
    'powertools.batch.sqsFifo.failedGroupIds',
    { fresh: () => new Set() }
  );

  public getCurrentGroupId(): string | undefined {
    return this.#currentGroupId.get();
  }

  public setCurrentGroupId(groupId: string | undefined): void {
    this.#currentGroupId.set(groupId);
  }

  public addFailedGroupId(groupId: string): void {
    this.getFailedGroupIds().add(groupId);
  }

  public hasFailedGroupId(groupId: string): boolean {
    return this.getFailedGroupIds().has(groupId);
  }

  public getFailedGroupIds(): Set<string> {
    return this.#failedGroupIds.get();
  }

  public clearFailedGroupIds(): void {
    this.#failedGroupIds.reset();
  }
}

export { SqsFifoProcessorStore };

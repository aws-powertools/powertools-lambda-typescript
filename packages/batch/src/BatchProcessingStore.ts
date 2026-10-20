import { InvocationScoped } from '@aws-lambda-powertools/commons/utils/invocation-scoped';
import type {
  BaseRecord,
  BatchProcessingOptions,
  EventSourceDataClassTypes,
  PartialItemFailureResponse,
} from './types.js';

/**
 * Manages storage of batch processing state with automatic context detection.
 *
 * This class abstracts the storage mechanism for state that must be scoped to
 * a single invocation, automatically choosing between the InvokeStore (when
 * invocations run concurrently in the same execution environment) and an
 * instance-level fallback shared across sequential invocations. The decision
 * is made at runtime on every access to support Lambda's transition to async
 * contexts.
 */
class BatchProcessingStore {
  readonly #records = new InvocationScoped<BaseRecord[]>(
    'powertools.batch.records',
    { fresh: () => [] }
  );
  readonly #handler = new InvocationScoped<CallableFunction>(
    'powertools.batch.handler',
    { fresh: () => () => {} }
  );
  readonly #options = new InvocationScoped<BatchProcessingOptions | undefined>(
    'powertools.batch.options',
    { initial: undefined }
  );
  readonly #failureMessages = new InvocationScoped<EventSourceDataClassTypes[]>(
    'powertools.batch.failureMessages',
    { fresh: () => [] }
  );
  readonly #successMessages = new InvocationScoped<EventSourceDataClassTypes[]>(
    'powertools.batch.successMessages',
    { fresh: () => [] }
  );
  readonly #batchResponse = new InvocationScoped<PartialItemFailureResponse>(
    'powertools.batch.batchResponse',
    { fresh: () => ({ batchItemFailures: [] }) }
  );
  readonly #errors = new InvocationScoped<Error[]>('powertools.batch.errors', {
    fresh: () => [],
  });

  public getRecords(): BaseRecord[] {
    return this.#records.get();
  }

  public setRecords(records: BaseRecord[]): void {
    this.#records.set(records);
  }

  public getHandler(): CallableFunction {
    return this.#handler.get();
  }

  public setHandler(handler: CallableFunction): void {
    this.#handler.set(handler);
  }

  public getOptions(): BatchProcessingOptions | undefined {
    return this.#options.get();
  }

  public setOptions(options: BatchProcessingOptions | undefined): void {
    this.#options.set(options);
  }

  public getFailureMessages(): EventSourceDataClassTypes[] {
    return this.#failureMessages.get();
  }

  public setFailureMessages(messages: EventSourceDataClassTypes[]): void {
    this.#failureMessages.set(messages);
  }

  public getSuccessMessages(): EventSourceDataClassTypes[] {
    return this.#successMessages.get();
  }

  public setSuccessMessages(messages: EventSourceDataClassTypes[]): void {
    this.#successMessages.set(messages);
  }

  public getBatchResponse(): PartialItemFailureResponse {
    return this.#batchResponse.get();
  }

  public setBatchResponse(response: PartialItemFailureResponse): void {
    this.#batchResponse.set(response);
  }

  public getErrors(): Error[] {
    return this.#errors.get();
  }

  public setErrors(errors: Error[]): void {
    this.#errors.set(errors);
  }
}

export { BatchProcessingStore };

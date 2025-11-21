import '@aws/lambda-invoke-store';
import type {
  BaseRecord,
  BatchProcessingOptions,
  EventSourceDataClassTypes,
  PartialItemFailureResponse,
} from './types.js';

/**
 * Manages storage of batch processing state with automatic context detection.
 *
 * This class abstracts the storage mechanism for batch processing state,
 * automatically choosing between InvokeStore (when in Lambda context) and
 * fallback instance variables (when outside Lambda context). The decision is
 * made at runtime on every method call to support Lambda's concurrent execution
 * isolation.
 */
class BatchProcessingStore {
  readonly #recordsKey = Symbol('powertools.batch.records');
  readonly #handlerKey = Symbol('powertools.batch.handler');
  readonly #optionsKey = Symbol('powertools.batch.options');
  readonly #failureMessagesKey = Symbol('powertools.batch.failureMessages');
  readonly #successMessagesKey = Symbol('powertools.batch.successMessages');
  readonly #batchResponseKey = Symbol('powertools.batch.batchResponse');
  readonly #errorsKey = Symbol('powertools.batch.errors');

  #fallbackRecords: BaseRecord[] = [];
  #fallbackHandler: CallableFunction = () => {};
  #fallbackOptions?: BatchProcessingOptions;
  #fallbackFailureMessages: EventSourceDataClassTypes[] = [];
  #fallbackSuccessMessages: EventSourceDataClassTypes[] = [];
  #fallbackBatchResponse: PartialItemFailureResponse = {
    batchItemFailures: [],
  };
  #fallbackErrors: Error[] = [];

  public getRecords(): BaseRecord[] {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackRecords;
    }
    return (invokeStore.get(this.#recordsKey) as BaseRecord[]) ?? [];
  }

  public setRecords(records: BaseRecord[]): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackRecords = records;
      return;
    }
    invokeStore.set(this.#recordsKey, records);
  }

  public getHandler(): CallableFunction {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackHandler;
    }
    return (
      (invokeStore.get(this.#handlerKey) as CallableFunction) ?? (() => {})
    );
  }

  public setHandler(handler: CallableFunction): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackHandler = handler;
      return;
    }
    invokeStore.set(this.#handlerKey, handler);
  }

  public getOptions(): BatchProcessingOptions | undefined {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackOptions;
    }
    return invokeStore.get(this.#optionsKey) as
      | BatchProcessingOptions
      | undefined;
  }

  public setOptions(options: BatchProcessingOptions | undefined): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackOptions = options;
      return;
    }
    invokeStore.set(this.#optionsKey, options);
  }

  public getFailureMessages(): EventSourceDataClassTypes[] {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackFailureMessages;
    }
    return (
      (invokeStore.get(
        this.#failureMessagesKey
      ) as EventSourceDataClassTypes[]) ?? []
    );
  }

  public setFailureMessages(messages: EventSourceDataClassTypes[]): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackFailureMessages = messages;
      return;
    }
    invokeStore.set(this.#failureMessagesKey, messages);
  }

  public getSuccessMessages(): EventSourceDataClassTypes[] {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackSuccessMessages;
    }
    return (
      (invokeStore.get(
        this.#successMessagesKey
      ) as EventSourceDataClassTypes[]) ?? []
    );
  }

  public setSuccessMessages(messages: EventSourceDataClassTypes[]): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackSuccessMessages = messages;
      return;
    }
    invokeStore.set(this.#successMessagesKey, messages);
  }

  public getBatchResponse(): PartialItemFailureResponse {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackBatchResponse;
    }
    return (
      (invokeStore.get(
        this.#batchResponseKey
      ) as PartialItemFailureResponse) ?? { batchItemFailures: [] }
    );
  }

  public setBatchResponse(response: PartialItemFailureResponse): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackBatchResponse = response;
      return;
    }
    invokeStore.set(this.#batchResponseKey, response);
  }

  public getErrors(): Error[] {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackErrors;
    }
    return (invokeStore.get(this.#errorsKey) as Error[]) ?? [];
  }

  public setErrors(errors: Error[]): void {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackErrors = errors;
      return;
    }
    invokeStore.set(this.#errorsKey, errors);
  }
}

export { BatchProcessingStore };

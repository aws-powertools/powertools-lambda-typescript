import { InvokeStore } from '@aws/lambda-invoke-store';
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
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackRecords;
    }
    return (InvokeStore.get(this.#recordsKey) as BaseRecord[]) ?? [];
  }

  public setRecords(records: BaseRecord[]): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackRecords = records;
      return;
    }
    InvokeStore.set(this.#recordsKey, records);
  }

  public getHandler(): CallableFunction {
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackHandler;
    }
    return (
      (InvokeStore.get(this.#handlerKey) as CallableFunction) ?? (() => {})
    );
  }

  public setHandler(handler: CallableFunction): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackHandler = handler;
      return;
    }
    InvokeStore.set(this.#handlerKey, handler);
  }

  public getOptions(): BatchProcessingOptions | undefined {
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackOptions;
    }
    return InvokeStore.get(this.#optionsKey) as
      | BatchProcessingOptions
      | undefined;
  }

  public setOptions(options: BatchProcessingOptions | undefined): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackOptions = options;
      return;
    }
    InvokeStore.set(this.#optionsKey, options);
  }

  public getFailureMessages(): EventSourceDataClassTypes[] {
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackFailureMessages;
    }
    return (
      (InvokeStore.get(
        this.#failureMessagesKey
      ) as EventSourceDataClassTypes[]) ?? []
    );
  }

  public setFailureMessages(messages: EventSourceDataClassTypes[]): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackFailureMessages = messages;
      return;
    }
    InvokeStore.set(this.#failureMessagesKey, messages);
  }

  public getSuccessMessages(): EventSourceDataClassTypes[] {
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackSuccessMessages;
    }
    return (
      (InvokeStore.get(
        this.#successMessagesKey
      ) as EventSourceDataClassTypes[]) ?? []
    );
  }

  public setSuccessMessages(messages: EventSourceDataClassTypes[]): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackSuccessMessages = messages;
      return;
    }
    InvokeStore.set(this.#successMessagesKey, messages);
  }

  public getBatchResponse(): PartialItemFailureResponse {
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackBatchResponse;
    }
    return (
      (InvokeStore.get(
        this.#batchResponseKey
      ) as PartialItemFailureResponse) ?? { batchItemFailures: [] }
    );
  }

  public setBatchResponse(response: PartialItemFailureResponse): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackBatchResponse = response;
      return;
    }
    InvokeStore.set(this.#batchResponseKey, response);
  }

  public getErrors(): Error[] {
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackErrors;
    }
    return (InvokeStore.get(this.#errorsKey) as Error[]) ?? [];
  }

  public setErrors(errors: Error[]): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackErrors = errors;
      return;
    }
    InvokeStore.set(this.#errorsKey, errors);
  }
}

export { BatchProcessingStore };

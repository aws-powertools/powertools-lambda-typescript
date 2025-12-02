import '@aws/lambda-invoke-store';
import { shouldUseInvokeStore } from '@aws-lambda-powertools/commons/utils/env';
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
    if (!shouldUseInvokeStore()) {
      return this.#fallbackRecords;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    return (store.get(this.#recordsKey) as BaseRecord[]) ?? [];
  }

  public setRecords(records: BaseRecord[]): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackRecords = records;
      return;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    store.set(this.#recordsKey, records);
  }

  public getHandler(): CallableFunction {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackHandler;
    }

    return (
      (globalThis.awslambda?.InvokeStore?.get(
        this.#handlerKey
      ) as CallableFunction) ?? (() => {})
    );
  }

  public setHandler(handler: CallableFunction): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackHandler = handler;
      return;
    }

    globalThis.awslambda?.InvokeStore?.set(this.#handlerKey, handler);
  }

  public getOptions(): BatchProcessingOptions | undefined {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackOptions;
    }

    return globalThis.awslambda?.InvokeStore?.get(this.#optionsKey) as
      | BatchProcessingOptions
      | undefined;
  }

  public setOptions(options: BatchProcessingOptions | undefined): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackOptions = options;
      return;
    }

    globalThis.awslambda?.InvokeStore?.set(this.#optionsKey, options);
  }

  public getFailureMessages(): EventSourceDataClassTypes[] {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackFailureMessages;
    }

    return (
      (globalThis.awslambda?.InvokeStore?.get(
        this.#failureMessagesKey
      ) as EventSourceDataClassTypes[]) ?? []
    );
  }

  public setFailureMessages(messages: EventSourceDataClassTypes[]): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackFailureMessages = messages;
      return;
    }

    globalThis.awslambda?.InvokeStore?.set(this.#failureMessagesKey, messages);
  }

  public getSuccessMessages(): EventSourceDataClassTypes[] {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackSuccessMessages;
    }

    return (
      (globalThis.awslambda?.InvokeStore?.get(
        this.#successMessagesKey
      ) as EventSourceDataClassTypes[]) ?? []
    );
  }

  public setSuccessMessages(messages: EventSourceDataClassTypes[]): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackSuccessMessages = messages;
      return;
    }

    globalThis.awslambda?.InvokeStore?.set(this.#successMessagesKey, messages);
  }

  public getBatchResponse(): PartialItemFailureResponse {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackBatchResponse;
    }

    return (
      (globalThis.awslambda?.InvokeStore?.get(
        this.#batchResponseKey
      ) as PartialItemFailureResponse) ?? { batchItemFailures: [] }
    );
  }

  public setBatchResponse(response: PartialItemFailureResponse): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackBatchResponse = response;
      return;
    }

    globalThis.awslambda?.InvokeStore?.set(this.#batchResponseKey, response);
  }

  public getErrors(): Error[] {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackErrors;
    }

    return (
      (globalThis.awslambda?.InvokeStore?.get(this.#errorsKey) as Error[]) ?? []
    );
  }

  public setErrors(errors: Error[]): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackErrors = errors;
      return;
    }

    globalThis.awslambda?.InvokeStore?.set(this.#errorsKey, errors);
  }
}

export { BatchProcessingStore };

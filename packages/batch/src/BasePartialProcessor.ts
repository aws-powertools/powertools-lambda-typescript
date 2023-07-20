import type {
  BatchProcessingOptions,
  EventSourceType,
  FailureResponse,
  SuccessResponse,
} from './types';
import { EventType } from './constants';

/**
 * Abstract class for batch processors.
 *
 * The class provides a common interface for processing batches of records.
 */
abstract class BasePartialProcessor {
  /**
   * List of records that failed processing with their corresponding error
   */
  public failureMessages: EventSourceType[];
  /**
   * List of records that succeeded processing with their corresponding result
   */
  public successMessages: EventSourceType[];
  /**
   * List of errors that were thrown during processing
   */
  protected errors: Error[];
  /**
   * Handler used to process records
   */
  protected handler: CallableFunction;
  /**
   * Options passed to the handler
   */
  protected options?: BatchProcessingOptions;
  /**
   * List of records to be processed
   */
  protected records: EventSourceType[];

  public constructor() {
    this.successMessages = [];
    this.failureMessages = [];
    this.errors = [];
    this.records = [];
    this.handler = new Function();
  }

  /**
   * Process a batch of records asynchronously.
   *
   * When processing a batch of records, this processor will call the
   * handler on each record and then store the promise returned by each call.
   *
   * It then waits for all promises to resolve and returns a list of results.
   */
  public async asyncProcess(): Promise<(SuccessResponse | FailureResponse)[]> {
    /**
     * If this is an sync processor, user should have called process instead,
     * so we call the method early to throw the error early thus failing fast.
     */
    if (this.constructor.name === 'BatchProcessor') {
      await this.asyncProcessRecord(this.records[0]);
    }
    this.prepare();

    const processingPromises: Promise<SuccessResponse | FailureResponse>[] =
      this.records.map((record) => this.asyncProcessRecord(record));

    const processedRecords: (SuccessResponse | FailureResponse)[] =
      await Promise.all(processingPromises);

    this.clean();

    return processedRecords;
  }

  /**
   * Abstract method to process a record asynchronously.
   *
   * @param record Record to be processed
   */
  public abstract asyncProcessRecord(
    record: EventSourceType
  ): Promise<SuccessResponse | FailureResponse>;

  /**
   * Process a batch of records synchronously.
   *
   * When processing a batch of records, this processor will call the
   * handler on each record sequentially and then return a list of results.
   */
  public process(): (SuccessResponse | FailureResponse)[] {
    /**
     * If this is an async processor, user should have called processAsync instead,
     * so we call the method early to throw the error early thus failing fast.
     */
    if (this.constructor.name === 'AsyncBatchProcessor') {
      this.processRecord(this.records[0]);
    }
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    for (const record of this.records) {
      processedRecords.push(this.processRecord(record));
    }

    this.clean();

    return processedRecords;
  }

  /**
   * Abstract method to process a record synchronously.
   *
   * @param record Record to be processed
   */
  public abstract processRecord(
    record: EventSourceType
  ): SuccessResponse | FailureResponse;

  /**
   * Register a batch of records to be processed and the handler to process them.
   *
   * @param records Batch of records to be processed
   * @param handler Function to process each record
   * @param options Options to be passed to the handler, such as the AWS Lambda context
   */
  public register(
    records: EventSourceType[],
    handler: CallableFunction,
    options?: BatchProcessingOptions
  ): void {
    if (!records) {
      const eventTypes: string = Object.values(EventType).toString();
      throw new Error(
        'Failed to convert event to record batch for processing.\nPlease ensure batch event is a valid ' +
          eventTypes +
          ' event.'
      );
    }

    this.records = records;
    this.handler = handler;
    this.options = options;
  }

  /**
   * Abstract method to clean up class instance after processing.
   *
   * This method is called once, after processing the batch.
   * It can be used to clean up state or perform any side effects.
   */
  protected abstract clean(): void;

  /**
   * Store the result of a failed record processing
   *
   * @param record Record that was processed
   * @param error Error thrown by record handler
   */
  protected failureHandler(
    record: EventSourceType,
    error: Error
  ): FailureResponse {
    const entry: FailureResponse = ['fail', error.message, record];
    this.errors.push(error);
    this.failureMessages.push(record);

    return entry;
  }

  /**
   * Abstract method to prepare class instance before processing.
   *
   * This method is called once, before processing the batch.
   * It can be used to initialize state or perform any side effects.
   */
  protected abstract prepare(): void;

  /**
   * Store the result of a successful record processing
   *
   * @param record Record that was processed
   * @param result Result returned by record handler
   */
  protected successHandler(
    record: EventSourceType,
    result: unknown
  ): SuccessResponse {
    const entry: SuccessResponse = ['success', result, record];
    this.successMessages.push(record);

    return entry;
  }
}

export { BasePartialProcessor };

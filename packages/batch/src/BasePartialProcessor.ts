import type {
  BaseRecord,
  BatchProcessingOptions,
  EventSourceDataClassTypes,
  FailureResponse,
  SuccessResponse,
} from './types.js';

/**
 * Abstract class for batch processors.
 *
 * This class provides a common interface for processing records in a batch.
 *
 * Batch processors implementing this class should provide implementations for
 * a number of abstract methods that are specific to the type of processor or the
 * type of records being processed.
 *
 * The class comes with a few helper methods and hooks that can be used to prepare
 * the processor before processing records, clean up after processing records, and
 * handle records that succeed or fail processing.
 *
 * @abstract
 */
abstract class BasePartialProcessor {
  /**
   * List of errors that occurred during processing
   */
  public errors: Error[];

  /**
   * List of records that failed processing
   */
  public failureMessages: EventSourceDataClassTypes[];

  /**
   * Record handler provided by customers to process records
   */
  public handler: CallableFunction;

  /**
   * Options to be used during processing (optional)
   */
  public options?: BatchProcessingOptions;

  /**
   * List of records to be processed
   */
  public records: BaseRecord[];

  /**
   * List of records that were processed successfully
   */
  public successMessages: EventSourceDataClassTypes[];

  public constructor() {
    this.successMessages = [];
    this.failureMessages = [];
    this.errors = [];
    this.records = [];
    // No-op function to avoid null checks, will be overridden by customer when using the class
    this.handler = new Function();
  }

  /**
   * Clean or resets the processor instance after completing a batch
   *
   * This method should be called after processing a full batch to reset the processor.
   *
   * You can use this as a hook to run any cleanup logic after processing the records.
   *
   * @abstract
   */
  public abstract clean(): void;

  /**
   * Method to handle a record that failed processing
   *
   * This method should be called when a record fails processing so that
   * the processor can keep track of the error and the record that failed.
   *
   * @param record Record that failed processing
   * @param error Error that was thrown
   */
  public failureHandler(
    record: EventSourceDataClassTypes,
    error: Error
  ): FailureResponse {
    const entry: FailureResponse = ['fail', error.message, record];
    this.errors.push(error);
    this.failureMessages.push(record);

    return entry;
  }

  /**
   * Prepare class instance before processing
   *
   * This method should be called before processing the records
   *
   * You can use this as a hook to run any setup logic before processing the records.
   *
   * @abstract
   */
  public abstract prepare(): void;

  /**
   * Process all records with an asyncronous handler
   *
   * Once called, the processor will create an array of promises to process each record
   * and wait for all of them to settle before returning the results.
   *
   * Before and after processing, the processor will call the prepare and clean methods respectively.
   */
  public async process(): Promise<(SuccessResponse | FailureResponse)[]> {
    /**
     * If this is a sync processor, user should have called processSync instead,
     * so we call the method early to throw the error early thus failing fast.
     */
    if (this.constructor.name === 'BatchProcessorSync') {
      await this.processRecord(this.records[0]);
    }
    this.prepare();

    const processingPromises: Promise<SuccessResponse | FailureResponse>[] =
      this.records.map((record) => this.processRecord(record));

    const processedRecords: (SuccessResponse | FailureResponse)[] =
      await Promise.all(processingPromises);

    this.clean();

    return processedRecords;
  }

  /**
   * Process a record with an asyncronous handler
   *
   * An implementation of this method is required for asyncronous processors.
   *
   * When implementing this method, you should at least call the successHandler method
   * when a record succeeds processing and the failureHandler method when a record
   * fails processing.
   *
   * This is to ensure that the processor keeps track of the results and the records
   * that succeeded and failed processing.
   *
   * @abstract
   *
   * @param record Record to be processed
   */
  public abstract processRecord(
    record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse>;

  /**
   * Process a record with a synchronous handler
   *
   * An implementation of this method is required for synchronous processors.
   *
   * When implementing this method, you should at least call the successHandler method
   * when a record succeeds processing and the failureHandler method when a record
   * fails processing.
   *
   * This is to ensure that the processor keeps track of the results and the records
   * that succeeded and failed processing.
   *
   * @abstract
   *
   * @param record Record to be processed
   */
  public abstract processRecordSync(
    record: BaseRecord
  ): SuccessResponse | FailureResponse;

  /**
   * Orchestrate the processing of a batch of records synchronously
   * and sequentially.
   *
   * The method is responsible for calling the prepare method before
   * processing the records and the clean method after processing the records.
   *
   * In the middle, the method will iterate over the records and call the
   * processRecordSync method for each record.
   *
   * @returns List of processed records
   */
  public processSync(): (SuccessResponse | FailureResponse)[] {
    /**
     * If this is an async processor, user should have called process instead,
     * so we call the method early to throw the error early thus failing fast.
     */
    if (this.constructor.name === 'BatchProcessor') {
      this.processRecordSync(this.records[0]);
    }
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    for (const record of this.records) {
      processedRecords.push(this.processRecordSync(record));
    }

    this.clean();

    return processedRecords;
  }

  /**
   * Set up the processor with the records and the handler
   *
   * This method should be called before processing the records to
   * bind the records and the handler for a specific invocation to
   * the processor.
   *
   * We use a separate method to do this rather than the constructor
   * to allow for reusing the processor instance across multiple invocations
   * by instantiating the processor outside of the Lambda function handler.
   *
   * @param records Array of records to be processed
   * @param handler CallableFunction to process each record from the batch
   * @param options Options to be used during processing (optional)
   */
  public register(
    records: BaseRecord[],
    handler: CallableFunction,
    options?: BatchProcessingOptions
  ): this {
    this.records = records;
    this.handler = handler;

    if (options) {
      this.options = options;
    }

    return this;
  }

  /**
   * Method to handle a record that succeeded processing
   *
   * This method should be called when a record succeeds processing so that
   * the processor can keep track of the result and the record that succeeded.
   *
   * @param record Record that succeeded processing
   * @param result Result from record handler
   */
  public successHandler(
    record: EventSourceDataClassTypes,
    result: unknown
  ): SuccessResponse {
    const entry: SuccessResponse = ['success', result, record];
    this.successMessages.push(record);

    return entry;
  }
}

export { BasePartialProcessor };

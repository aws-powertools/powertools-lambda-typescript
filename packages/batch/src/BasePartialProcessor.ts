/**
 * Abstract class for batch processors
 */
import {
  BaseRecord,
  BatchProcessingOptions,
  EventSourceDataClassTypes,
  FailureResponse,
  ResultType,
  SuccessResponse,
} from '.';

abstract class BasePartialProcessor {
  public exceptions: Error[];

  public failureMessages: EventSourceDataClassTypes[];

  public handler: CallableFunction;

  public options?: BatchProcessingOptions;

  public records: BaseRecord[];

  public successMessages: EventSourceDataClassTypes[];

  /**
   * Initializes base processor class
   */
  public constructor() {
    this.successMessages = [];
    this.failureMessages = [];
    this.exceptions = [];
    this.records = [];
    this.handler = new Function();
  }

  /**
   * Clean class instance after processing
   */
  public abstract clean(): void;

  /**
   * Keeps track of batch records that failed processing
   * @param record record that failed processing
   * @param exception exception that was thrown
   * @returns FailureResponse object with ["fail", exception, original record]
   */
  public failureHandler(
    record: EventSourceDataClassTypes,
    exception: Error
  ): FailureResponse {
    const entry: FailureResponse = ['fail', exception.message, record];
    // console.debug('Record processing exception: ' + exception.message);
    this.exceptions.push(exception);
    this.failureMessages.push(record);

    return entry;
  }

  /**
   * Prepare class instance before processing
   */
  public abstract prepare(): void;

  /**
   * Call instance's handler for each record
   * @returns List of processed records
   */
  public async process(): Promise<(SuccessResponse | FailureResponse)[]> {
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    for (const record of this.records) {
      processedRecords.push(await this.processRecord(record));
    }

    this.clean();

    return processedRecords;
  }

  /**
   * Process a record with the handler
   * @param record Record to be processed
   */
  public abstract processRecord(
    record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse>;

  /**
   * Set class instance attributes before execution
   * @param records List of records to be processed
   * @param handler CallableFunction to process entries of "records"
   * @returns this object
   */
  public register(
    records: BaseRecord[],
    handler: CallableFunction,
    options?: BatchProcessingOptions
  ): BasePartialProcessor {
    this.records = records;
    this.handler = handler;

    if (options) {
      this.options = options;
    }

    return this;
  }

  /**
   * Keeps track of batch records that were processed successfully
   * @param record record that succeeded processing
   * @param result result from record handler
   * @returns SuccessResponse object with ["success", result, original record]
   */
  public successHandler(
    record: EventSourceDataClassTypes,
    result: ResultType
  ): SuccessResponse {
    const entry: SuccessResponse = ['success', result, record];
    this.successMessages.push(record);

    return entry;
  }
}

export { BasePartialProcessor };

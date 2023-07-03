import { Context } from 'aws-lambda';
import {
  BaseRecord,
  EventSourceDataClassTypes,
  FailureResponse,
  ResultType,
  SuccessResponse,
} from '.';

/**
 * Abstract class for batch processors
 */
abstract class BasePartialProcessor {
  public exceptions: Error[];

  public failureMessages: EventSourceDataClassTypes[];

  public handler: CallableFunction = new Function();

  public lambdaContext?: Context;

  public records: BaseRecord[];

  public successMessages: EventSourceDataClassTypes[];

  public constructor() {
    this.successMessages = [];
    this.failureMessages = [];
    this.exceptions = [];
    this.records = [];
  }

  /**
   * Set instance attributes before execution
   * @param records List of records to be processed
   * @param handler CallableFunction to process entries of "records"
   * @param lambdaContext Optional parameter if lambda_context is to be injected
   * @returns this object
   */
  public call(
    records: BaseRecord[],
    handler: CallableFunction,
    lambdaContext?: Context
  ): BasePartialProcessor {
    this.records = records;
    this.handler = handler;

    if (lambdaContext != null) {
      this.lambdaContext = lambdaContext;
    }

    return this;
  }

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
    this.exceptions.push(exception);
    this.failureMessages.push(record);

    return entry;
  }

  public abstract prepare(): void;

  /**
   * Call instance's handler for each record
   * @returns List of processed records
   */
  public async process(): Promise<(SuccessResponse | FailureResponse)[]> {
    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    for (const record of this.records) {
      processedRecords.push(await this.processRecord(record));
    }

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

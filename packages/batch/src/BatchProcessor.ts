import type { BaseRecord, FailureResponse, SuccessResponse } from './types';
import {
  EventSourceDataClassTypes,
  PartialItemFailureResponse,
  PartialItemFailures,
} from './types';
import { DATA_CLASS_MAPPING, DEFAULT_RESPONSE, EventType } from './constants';
import { BasePartialProcessor } from './BasePartialProcessor';
import { FullBatchFailureError } from './errors';
import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';

/**
 * Process native partial responses from SQS, Kinesis Data Streams, and DynamoDB
 */
class BatchProcessor extends BasePartialProcessor {
  public COLLECTOR_MAPPING;

  public batchResponse: PartialItemFailureResponse;

  public eventType: keyof typeof EventType;

  /**
   * Initializes base batch processing class
   * @param eventType Whether this is SQS, DynamoDB stream, or Kinesis data stream event
   */
  public constructor(eventType: keyof typeof EventType) {
    super();
    this.eventType = eventType;
    this.batchResponse = DEFAULT_RESPONSE;
    this.COLLECTOR_MAPPING = {
      [EventType.SQS]: () => this.collectSqsFailures(),
      [EventType.KinesisDataStreams]: () => this.collectKinesisFailures(),
      [EventType.DynamoDBStreams]: () => this.collectDynamoDBFailures(),
    };
  }

  /**
   * Report messages to be deleted in case of partial failures
   */
  public clean(): void {
    if (!this.hasMessagesToReport()) {
      return;
    }

    if (this.entireBatchFailed()) {
      throw new FullBatchFailureError(this.errors);
    }

    const messages: PartialItemFailures[] = this.getMessagesToReport();
    this.batchResponse = { batchItemFailures: messages };
  }

  /**
   * Collects identifiers of failed items for a DynamoDB stream
   * @returns list of identifiers for failed items
   */
  public collectDynamoDBFailures(): PartialItemFailures[] {
    const failures: PartialItemFailures[] = [];

    for (const msg of this.failureMessages) {
      const msgId = (msg as DynamoDBRecord).dynamodb?.SequenceNumber;
      if (msgId) {
        failures.push({ itemIdentifier: msgId });
      }
    }

    return failures;
  }

  /**
   * Collects identifiers of failed items for a Kinesis stream
   * @returns list of identifiers for failed items
   */
  public collectKinesisFailures(): PartialItemFailures[] {
    const failures: PartialItemFailures[] = [];

    for (const msg of this.failureMessages) {
      const msgId = (msg as KinesisStreamRecord).kinesis.sequenceNumber;
      failures.push({ itemIdentifier: msgId });
    }

    return failures;
  }

  /**
   * Collects identifiers of failed items for an SQS batch
   * @returns list of identifiers for failed items
   */
  public collectSqsFailures(): PartialItemFailures[] {
    const failures: PartialItemFailures[] = [];

    for (const msg of this.failureMessages) {
      const msgId = (msg as SQSRecord).messageId;
      failures.push({ itemIdentifier: msgId });
    }

    return failures;
  }

  /**
   * Determines whether all records in a batch failed to process
   * @returns true if all records resulted in exception results
   */
  public entireBatchFailed(): boolean {
    return this.errors.length == this.records.length;
  }

  /**
   * Collects identifiers for failed batch items
   * @returns formatted messages to use in batch deletion
   */
  public getMessagesToReport(): PartialItemFailures[] {
    return this.COLLECTOR_MAPPING[this.eventType]();
  }

  /**
   * Determines if any records failed to process
   * @returns true if any records resulted in exception
   */
  public hasMessagesToReport(): boolean {
    return this.failureMessages.length != 0;
  }

  /**
   * Remove results from previous execution
   */
  public prepare(): void {
    this.successMessages.length = 0;
    this.failureMessages.length = 0;
    this.errors.length = 0;
    this.batchResponse = DEFAULT_RESPONSE;
  }

  public async processRecord(
    record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    try {
      const data = this.toBatchType(record, this.eventType);
      const result = await this.handler(data, this.options?.context);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }

  /**
   * Process a record with instance's handler
   * @param record Batch record to be processed
   * @returns response of success or failure
   */
  public processRecordSync(
    record: BaseRecord
  ): SuccessResponse | FailureResponse {
    try {
      const data = this.toBatchType(record, this.eventType);
      const result = this.handler(data, this.options?.context);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }

  /**
   * @returns Batch items that failed processing, if any
   */
  public response(): PartialItemFailureResponse {
    return this.batchResponse;
  }

  public toBatchType(
    record: EventSourceDataClassTypes,
    eventType: keyof typeof EventType
  ): SQSRecord | KinesisStreamRecord | DynamoDBRecord {
    return DATA_CLASS_MAPPING[eventType](record);
  }
}

export { BatchProcessor };

/**
 * Process batch and partially report failed items
 */
import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';
import {
  BasePartialProcessor,
  BatchProcessingError,
  DATA_CLASS_MAPPING,
  DEFAULT_RESPONSE,
  EventSourceDataClassTypes,
  EventType,
} from '.';

abstract class BasePartialBatchProcessor extends BasePartialProcessor {
  public COLLECTOR_MAPPING;

  public batchResponse: { [key: string]: { [key: string]: string }[] };

  public eventType: EventType;

  /**
   * Initializes base batch processing class
   * @param eventType Whether this is SQS, DynamoDB stream, or Kinesis data stream event
   */
  public constructor(eventType: EventType) {
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
      throw new BatchProcessingError(
        'All records failed processing. ' +
          this.exceptions.length +
          ' individual errors logged separately below.',
        this.exceptions
      );
    }

    const messages: { [key: string]: string }[] = this.getMessagesToReport();
    this.batchResponse = { batchItemFailures: messages };
  }

  /**
   * Collects identifiers of failed items for a DynamoDB stream
   * @returns list of identifiers for failed items
   */
  public collectDynamoDBFailures(): { [key: string]: string }[] {
    const failures: { [key: string]: string }[] = [];

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
  public collectKinesisFailures(): { [key: string]: string }[] {
    const failures: { [key: string]: string }[] = [];

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
  public collectSqsFailures(): { [key: string]: string }[] {
    const failures: { [key: string]: string }[] = [];

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
    return this.exceptions.length == this.records.length;
  }

  /**
   * Collects identifiers for failed batch items
   * @returns formatted messages to use in batch deletion
   */
  public getMessagesToReport(): { [key: string]: string }[] {
    return this.COLLECTOR_MAPPING[this.eventType]();
  }

  /**
   * Determines if any records failed to process
   * @returns true if any records resulted in exception
   */
  public hasMessagesToReport(): boolean {
    if (this.failureMessages.length != 0) {
      return true;
    }

    console.debug(
      'All ' + this.successMessages.length + ' records successfully processed'
    );

    return false;
  }

  /**
   * Remove results from previous execution
   */
  public prepare(): void {
    this.successMessages.length = 0;
    this.failureMessages.length = 0;
    this.exceptions.length = 0;
    this.batchResponse = DEFAULT_RESPONSE;
  }

  /**
   * @returns Batch items that failed processing, if any
   */
  public response(): { [key: string]: { [key: string]: string }[] } {
    return this.batchResponse;
  }

  public toBatchType(
    record: EventSourceDataClassTypes,
    eventType: EventType
  ): SQSRecord | KinesisStreamRecord | DynamoDBRecord {
    return DATA_CLASS_MAPPING[eventType](record);
  }
}

export { BasePartialBatchProcessor };

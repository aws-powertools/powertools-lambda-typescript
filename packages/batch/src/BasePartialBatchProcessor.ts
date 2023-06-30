import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';
import {
  BasePartialProcessor,
  BaseRecord,
  BatchProcessingError,
  DEFAULT_RESPONSE,
  DynamoDBRecordType,
  EventSourceDataClassTypes,
  EventType,
  KinesisStreamRecordType,
  SQSRecordType,
} from '.';

abstract class BasePartialBatchProcessor extends BasePartialProcessor {
  public COLLECTOR_MAPPING;

  public batchResponse: { [key: string]: { [key: string]: string }[] };

  public eventType: EventType;

  /**
   * Process batch and partially report failed items
   * @param eventType Whether this is SQS, DynamoDB stream, or Kinesis data stream event
   */
  public constructor(eventType: EventType) {
    super();
    this.eventType = eventType;
    this.batchResponse = DEFAULT_RESPONSE; // need to find deep clone alternative here
    this.COLLECTOR_MAPPING = {
      [EventType.SQS]: this.collectSqsFailures(),
      [EventType.KinesisDataStreams]: this.collectKinesisFailures(),
      [EventType.DynamoDBStreams]: this.collectDynamoDBFailures(),
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

  public collectDynamoDBFailures(): { [key: string]: string }[] {
    const failures: { [key: string]: string }[] = [];

    this.failureMessages.forEach((msg) => {
      const msgId = (msg as DynamoDBRecord).dynamodb?.SequenceNumber;
      if (msgId) {
        failures.push({ itemIdentifier: msgId });
      }
    });

    return failures;
  }

  public collectKinesisFailures(): { [key: string]: string }[] {
    const failures: { [key: string]: string }[] = [];

    this.failureMessages.forEach((msg) => {
      const msgId = (msg as KinesisStreamRecord).kinesis.sequenceNumber;
      failures.push({ itemIdentifier: msgId });
    });

    return failures;
  }

  public collectSqsFailures(): { [key: string]: string }[] {
    const failures: { [key: string]: string }[] = [];

    this.failureMessages.forEach((msg) => {
      const msgId = (msg as SQSRecord).messageId;
      failures.push({ itemIdentifier: msgId });
    });

    return failures;
  }

  public entireBatchFailed(): boolean {
    return this.exceptions.length == this.records.length;
  }

  /**
   * @returns formatted messages to use in batch deletion
   */
  public getMessagesToReport(): { [key: string]: string }[] {
    return this.COLLECTOR_MAPPING[this.eventType];
  }

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
    this.successMessages = []; // TO-DO: see if this needs to be a reference delete
    this.failureMessages = []; // If it does, use successMessages.length = 0 (less clarity)
    this.exceptions = []; // But it clears the array reference, not just a new empty array
    this.batchResponse = DEFAULT_RESPONSE; // need to find deep clone alternative here
  }

  /**
   * @returns Batch items that failed processing, if any
   */
  public response(): { [key: string]: { [key: string]: string }[] } {
    return this.batchResponse;
  }

  public toBatchType(
    record: BaseRecord,
    eventType: EventType
  ): EventSourceDataClassTypes {
    if (eventType == EventType.SQS) {
      return record as SQSRecordType;
    } else if (eventType == EventType.KinesisDataStreams) {
      return record as KinesisStreamRecordType;
    } else if (eventType == EventType.DynamoDBStreams) {
      return record as DynamoDBRecordType;
    } else {
      throw new Error('Invalid EventType provided');
    }
  }
}

export { BasePartialBatchProcessor };

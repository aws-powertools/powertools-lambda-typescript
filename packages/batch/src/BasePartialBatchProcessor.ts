import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { BasePartialProcessor } from './BasePartialProcessor.js';
import {
  DATA_CLASS_MAPPING,
  DEFAULT_RESPONSE,
  EventType,
} from './constants.js';
import { FullBatchFailureError } from './errors.js';
import type {
  EventSourceDataClassTypes,
  PartialItemFailureResponse,
  PartialItemFailures,
} from './types.js';

/**
 * Base abstract class for processing batch records with partial failure handling
 *
 * This class extends the {@link BasePartialProcessor} class and adds additional
 * functionality to handle batch processing. Specifically, it provides methods
 * to collect failed records and build the partial failure response.
 *
 * @abstract
 */
abstract class BasePartialBatchProcessor extends BasePartialProcessor {
  /**
   * Mapping of event types to their respective failure collectors
   *
   * Each service expects a different format for partial failure reporting,
   * this mapping ensures that the correct format is used for each event type.
   */
  public COLLECTOR_MAPPING;

  /**
   * Response to be returned after processing
   */
  public batchResponse: PartialItemFailureResponse;

  /**
   * Type of event that the processor is handling
   */
  public eventType: keyof typeof EventType;

  /**
   * Initializes base batch processing class
   *
   * @param eventType The type of event to process (SQS, Kinesis, DynamoDB)
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
   * Clean up logic to be run after processing a batch
   *
   * If the entire batch failed this method will throw a {@link FullBatchFailureError | `FullBatchFailureError`} with the list of
   * errors that occurred during processing, unless the `throwOnFullBatchFailure` option is set to `false`.
   *
   * Otherwise, it will build the partial failure response based on the event type.
   */
  public clean(): void {
    if (!this.hasMessagesToReport()) {
      return;
    }

    if (
      this.options?.throwOnFullBatchFailure !== false &&
      this.entireBatchFailed()
    ) {
      throw new FullBatchFailureError(this.errors);
    }

    const messages: PartialItemFailures[] = this.getMessagesToReport();
    this.batchResponse = { batchItemFailures: messages };
  }

  /**
   * Collect the identifiers of failed items for a DynamoDB stream
   *
   * The failures are collected based on the sequence number of the record
   * and formatted as a list of objects with the key `itemIdentifier` as
   * expected by the service.
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
   * Collect identifiers of failed items for a Kinesis batch
   *
   * The failures are collected based on the sequence number of the record
   * and formatted as a list of objects with the key `itemIdentifier` as
   * expected by the service.
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
   * Collect identifiers of failed items for an SQS batch
   *
   * The failures are collected based on the message ID of the record
   * and formatted as a list of objects with the key `itemIdentifier` as
   * expected by the service.
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
   * Determine if the entire batch failed
   *
   * If the number of errors is equal to the number of records, then the
   * entire batch failed and this method will return `true`.
   */
  public entireBatchFailed(): boolean {
    return this.errors.length == this.records.length;
  }

  /**
   * Collect identifiers for failed batch items
   *
   * The method will call the appropriate collector based on the event type
   * and return the list of failed items.
   */
  public getMessagesToReport(): PartialItemFailures[] {
    return this.COLLECTOR_MAPPING[this.eventType]();
  }

  /**
   * Determine if there are any failed records to report
   *
   * If there are no failed records, then the batch was successful
   * and this method will return `false`.
   */
  public hasMessagesToReport(): boolean {
    return this.failureMessages.length != 0;
  }

  /**
   * Set up the processor with the initial state ready for processing
   */
  public prepare(): void {
    this.successMessages.length = 0;
    this.failureMessages.length = 0;
    this.errors.length = 0;
    this.batchResponse = DEFAULT_RESPONSE;
  }

  /**
   * Get the response from the batch processing
   */
  public response(): PartialItemFailureResponse {
    return this.batchResponse;
  }

  /**
   * Forward a record to the appropriate batch type
   *
   * Based on the event type that the processor was initialized with, this method
   * will cast the record to the appropriate batch type handler.
   *
   * @param record The record to be processed
   * @param eventType The type of event to process
   */
  public toBatchType(
    record: EventSourceDataClassTypes,
    eventType: keyof typeof EventType
  ): SQSRecord | KinesisStreamRecord | DynamoDBRecord {
    return DATA_CLASS_MAPPING[eventType](record);
  }
}

export { BasePartialBatchProcessor };

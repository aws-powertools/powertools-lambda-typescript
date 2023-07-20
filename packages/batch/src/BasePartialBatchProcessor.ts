import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { BasePartialProcessor } from './BasePartialProcessor';
import { DEFAULT_RESPONSE, EventType } from './constants';
import { BatchProcessingError } from './errors';
import type { PartialItemFailureResponse, PartialItemFailures } from './types';

/**
 * Abstract class to process a batch of records and report partial failures
 */
abstract class BasePartialBatchProcessor extends BasePartialProcessor {
  /**
   * Response object to be used in reporting partial failures
   */
  protected batchResponse: PartialItemFailureResponse;
  /**
   * The type of event that triggered the Lambda function
   */
  private eventType: keyof typeof EventType;

  /**
   * Initializes base batch processing class
   * @param eventType Whether this is SQS, DynamoDB stream, or Kinesis data stream event
   */
  public constructor(eventType: keyof typeof EventType) {
    super();
    this.eventType = eventType;
    this.batchResponse = { ...DEFAULT_RESPONSE };
  }

  /**
   * Return response object to be used in reporting partial failures
   */
  public response(): PartialItemFailureResponse {
    return this.batchResponse;
  }

  /**
   * Perfom cleanup after processing a batch of records.
   *
   * If the entire batch failed, throw an error. Otherwise,
   * prepare the response object to be used in reporting partial failures.
   */
  protected clean(): void {
    if (!this.hasMessagesToReport()) {
      return;
    }

    if (this.entireBatchFailed()) {
      throw new BatchProcessingError(
        'All records failed processing. ' +
          this.errors.length +
          ' individual errors logged separately below.',
        this.errors
      );
    }

    this.batchResponse = { batchItemFailures: this.getMessagesToReport() };
  }

  /**
   * Collect the identifiers of failed items for a DynamoDB stream.
   */
  protected collectDynamoDBFailures(): PartialItemFailures[] {
    const failures: PartialItemFailures[] = [];

    for (const message of this.failureMessages) {
      const messageId = (message as DynamoDBRecord).dynamodb?.SequenceNumber;
      if (messageId) {
        failures.push({ itemIdentifier: messageId });
      }
    }

    return failures;
  }

  /**
   * Collect the identifiers of failed items for a Kinesis data stream.
   */
  protected collectKinesisFailures(): PartialItemFailures[] {
    return this.failureMessages.map((message) => {
      const {
        kinesis: { sequenceNumber },
      } = message as KinesisStreamRecord;

      return { itemIdentifier: sequenceNumber };
    });
  }

  /**
   * Collect the identifiers of failed items for a SQS queue.
   */
  protected collectSqsFailures(): PartialItemFailures[] {
    return this.failureMessages.map((message) => {
      const { messageId } = message as SQSRecord;

      return { itemIdentifier: messageId };
    });
  }

  /**
   * Determine whether the entire batch failed to be processed.
   */
  protected entireBatchFailed(): boolean {
    return this.errors.length === this.records.length;
  }

  /**
   * Collect all failed messages and returns them as a list of partial failures
   * according to the event type.
   */
  protected getMessagesToReport(): PartialItemFailures[] {
    switch (this.eventType) {
      case EventType.SQS:
        return this.collectSqsFailures();
      case EventType.KinesisDataStreams:
        return this.collectKinesisFailures();
      case EventType.DynamoDBStreams:
        return this.collectDynamoDBFailures();
    }
  }

  /**
   * Determine whether there are any failed messages to report as partial failures.
   */
  protected hasMessagesToReport(): boolean {
    return this.failureMessages.length != 0;
  }

  /**
   * Prepare class instance for processing a new batch of records.
   */
  protected prepare(): void {
    this.successMessages.length = 0;
    this.failureMessages.length = 0;
    this.errors.length = 0;
    this.batchResponse = { ...DEFAULT_RESPONSE };
  }
}

export { BasePartialBatchProcessor };

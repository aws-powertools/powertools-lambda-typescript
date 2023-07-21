import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import {
  BatchProcessor,
  EventType,
  FailureResponse,
  EventSourceType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

class MyProcessor extends BatchProcessor {
  #metrics: Metrics;

  public constructor(eventType: keyof typeof EventType) {
    super(eventType);
    this.#metrics = new Metrics({ namespace: 'test' });
  }

  public failureHandler(
    record: EventSourceType,
    error: Error
  ): FailureResponse {
    this.#metrics.addMetric('BatchRecordFailures', MetricUnits.Count, 1);

    return super.failureHandler(record, error);
  }
}

const processor = new MyProcessor(EventType.SQS);
const logger = new Logger();

const recordHandler = (record: SQSRecord): void => {
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
};

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  return processPartialResponse(event, recordHandler, processor, {
    context,
  });
};

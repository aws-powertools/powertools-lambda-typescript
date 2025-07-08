import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type {
  EventSourceDataClassTypes,
  FailureResponse,
} from '@aws-lambda-powertools/batch/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import type { SQSHandler, SQSRecord } from 'aws-lambda';

class MyProcessor extends BatchProcessor {
  #metrics: Metrics;

  public constructor(eventType: keyof typeof EventType) {
    super(eventType);
    this.#metrics = new Metrics({ namespace: 'test' });
  }

  public failureHandler(
    record: EventSourceDataClassTypes,
    error: Error
  ): FailureResponse {
    this.#metrics.addMetric('BatchRecordFailures', MetricUnit.Count, 1);

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

export const handler: SQSHandler = async (event, context) =>
  processPartialResponse(event, recordHandler, processor, {
    context,
  });

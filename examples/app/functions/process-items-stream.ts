import { assertIsError } from '#helpers/utils';
import { logger } from '#powertools/logger';
import { tracer } from '#powertools/tracer';
import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type {
  Context,
  DynamoDBBatchResponse,
  DynamoDBRecord,
  DynamoDBStreamEvent,
} from 'aws-lambda';
import { equal } from 'node:assert/strict';

const processor = new BatchProcessor(EventType.DynamoDBStreams);

/**
 * This function processes a single DynamoDB record from a DynamoDB stream.
 *
 * If the function returns normally, the item is considered to be successfully processed.
 * If it throws an error, the item is considered to have failed processing and will be marked for retry.
 *
 * @param record The DynamoDB record to process
 */
const recordHandler = async (record: DynamoDBRecord): Promise<void> => {
  logger.debug('processing record', { record });
  const subsegment = tracer
    .getSegment()
    ?.addNewSubsegment('#### recordHandler');
  try {
    if (record.dynamodb && record.dynamodb.NewImage) {
      const payload = unmarshall(
        record.dynamodb.NewImage as { [key: string]: AttributeValue }
      );

      // Add itemId to the logger so that it's included in every log message
      logger.appendKeys({ itemId: payload.id });
      // Also add it to the subsegment, so you can search for traces by itemId
      subsegment?.addAnnotation('itemId', payload.id);

      const query = new URLSearchParams();
      query.set('name', payload.name);

      const remoteUrl = `https://httpbin.org/anything?${query.toString()}`;
      logger.debug('sending request', { remoteUrl });

      // This request doesn't show up in the trace yet, see #1619 for updates
      const response = await fetch(remoteUrl);
      // If the request was successful, the response.ok property will be true
      equal(response.ok, true);

      logger.debug('request completed', {
        response: await response.json(),
        status: response.status,
      });
    }
  } catch (error) {
    assertIsError(error);
    logger.error('error processing record', error);
    subsegment?.addError(error, true);

    throw error;
  } finally {
    logger.removeKeys(['itemId']);
    subsegment?.close();
  }
};

/**
 * This function shows how to process a batch of DynamoDB records from a DynamoDB stream.
 *
 * The functions uses the `processPartialResponse` function from the `@aws-lambda-powertools/batch` package
 * to process the records in parallel using the `recordHandler` function.
 *
 * The `processPartialResponse` is wrapped in a `tracer.provider.captureAsyncFunc` to ensure that the whole
 * process is captured in a single trace.
 */
export const handler = async (
  event: DynamoDBStreamEvent,
  context: Context
): Promise<DynamoDBBatchResponse> => {
  return tracer.provider.captureAsyncFunc('### handler', async (segment) => {
    const result = await processPartialResponse(
      event,
      recordHandler,
      processor,
      { context }
    );

    segment?.close();

    return result;
  }) as DynamoDBBatchResponse;
};

import { randomUUID } from 'node:crypto';
import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import { createPeerBarrier } from '@aws-lambda-powertools/testing-utils/lmi/handler';
import type { Context, SQSRecord } from 'aws-lambda';
import {
  BatchProcessor,
  EventType,
  processPartialResponse,
  SqsFifoPartialProcessorAsync,
} from '../../src/index.js';
import type { IsolationEvent, IsolationResult } from '../helpers/lmi.js';

// Shared exactly as in user functions. Each deployed handler has its own module.
const processor = new BatchProcessor(EventType.SQS);
const fifoProcessor = new SqsFifoPartialProcessorAsync();
const executionEnvId = randomUUID();
const awaitPeer = createPeerBarrier();

/** Processes a batch while a peer invocation has registered its own state. */
const processBatch = async (
  event: IsolationEvent,
  context: Context,
  fifo: boolean
): Promise<IsolationResult> => {
  let first = true;
  let sawPeer = false;
  const processedMessageIds: string[] = [];
  const recordHandler = async (record: SQSRecord) => {
    processedMessageIds.push(record.messageId);
    if (first && event.role === 'test') {
      first = false;
      sawPeer = await awaitPeer();
    }
    if (JSON.parse(record.body).shouldFail) {
      throw new Error(`Simulated failure for ${record.messageId}`);
    }
  };
  const options = { context, throwOnFullBatchFailure: false };
  const response = fifo
    ? await processPartialResponse(event, recordHandler, fifoProcessor, {
        ...options,
        skipGroupOnError: true,
      })
    : await processPartialResponse(event, recordHandler, processor, options);

  return {
    invocationId: event.invocationId,
    executionEnvId,
    sawPeer,
    initializationType: getStringFromEnv({
      key: 'AWS_LAMBDA_INITIALIZATION_TYPE',
      defaultValue: 'unset',
    }),
    maxConcurrency: getStringFromEnv({
      key: 'AWS_LAMBDA_MAX_CONCURRENCY',
      defaultValue: 'unset',
    }),
    receivedMessageIds: event.Records.map((record) => record.messageId),
    processedMessageIds,
    failedMessageIds: response.batchItemFailures.map(
      (failure) => failure.itemIdentifier
    ),
  };
};

/** Exercises a module-scoped standard SQS processor. */
export const handler = (event: IsolationEvent, context: Context) =>
  processBatch(event, context, false);

/** Exercises a module-scoped FIFO processor with failed-group isolation. */
export const fifoHandler = (event: IsolationEvent, context: Context) =>
  processBatch(event, context, true);

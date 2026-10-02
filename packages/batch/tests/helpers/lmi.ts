import type { SQSEvent } from 'aws-lambda';
import { sqsRecordFactory } from './factories.js';

/** Carries synthetic SQS records and controls the overlap barrier. */
type IsolationEvent = SQSEvent & {
  invocationId: string;
  role: 'warmup' | 'test';
};

/** Reports the observable state of one batch invocation. */
type IsolationResult = {
  invocationId: string;
  executionEnvId: string;
  sawPeer: boolean;
  initializationType: string;
  maxConcurrency: string;
  receivedMessageIds: string[];
  processedMessageIds: string[];
  failedMessageIds: string[];
};

// Alternate healthy, group-0 failure, group-1 failure, and full failure.
// Both groups recur after their first record to exercise FIFO short circuits.
const failurePatterns = [[], [0], [1], [0, 1, 2, 3, 4, 5]];
const fifoFailurePatterns = [[], [0, 2, 4], [1, 3, 5], [0, 1, 2, 3, 4, 5]];
const fifoProcessedPatterns = [
  [0, 1, 2, 3, 4, 5],
  [0, 1, 3, 5],
  [0, 1, 2, 4],
  [0, 1],
];

/** Builds a batch with invocation-specific IDs and independently specified expectations. */
const createIsolationInvocation = (index: number, fifo: boolean) => {
  const invocationId = `inv-${index}`;
  const pattern = index % failurePatterns.length;
  const messageIds = Array.from(
    { length: 6 },
    (_, recordIndex) => `${invocationId}-msg-${recordIndex}`
  );
  const event: IsolationEvent = {
    invocationId,
    role: 'test',
    Records: messageIds.map((messageId, recordIndex) => ({
      ...sqsRecordFactory(
        JSON.stringify({
          invocationId,
          shouldFail: failurePatterns[pattern].includes(recordIndex),
        }),
        `group-${recordIndex % 2}`
      ),
      messageId,
    })),
  };
  return {
    event,
    expectedFailedMessageIds: (fifo ? fifoFailurePatterns : failurePatterns)[
      pattern
    ].map((recordIndex) => messageIds[recordIndex]),
    expectedProcessedMessageIds: fifo
      ? fifoProcessedPatterns[pattern].map(
          (recordIndex) => messageIds[recordIndex]
        )
      : messageIds,
  };
};

export type { IsolationEvent, IsolationResult };
export { createIsolationInvocation };

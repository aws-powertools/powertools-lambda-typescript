import { randomUUID } from 'node:crypto';
import { Logger } from '@aws-lambda-powertools/logger';
import {
  captureJsonStdout,
  createPeerBarrier,
} from '@aws-lambda-powertools/testing-utils/lmi/handler';
import type { Context } from 'aws-lambda';

// Module scope: identifies the execution environment across invocations
const executionEnvId = randomUUID();

// The log lines the Logger emits, returned in the response payload since on
// LMI the test cannot read them from the Invoke API or CloudWatch in time
const capturedLogs = captureJsonStdout<{
  message: string;
  invocationKey?: string;
  function_request_id?: string;
}>();

const logger = new Logger();

// Shared by invocations multiplexed into this execution environment: each one
// blocks until a second invocation is in flight, proving a genuine overlap
const awaitPeer = createPeerBarrier();

export const handler = async (
  event: { invocationId: string; role: 'warmup' | 'test' },
  context: Context
) => {
  logger.addContext(context);
  logger.appendKeys({ invocationKey: event.invocationId });

  const sawPeer = event.role === 'test' ? await awaitPeer() : false;

  logger.info('LMI isolation test');
  logger.resetKeys();

  return {
    invocationId: event.invocationId,
    executionEnvId,
    sawPeer,
    initializationType: process.env.AWS_LAMBDA_INITIALIZATION_TYPE ?? 'unset',
    maxConcurrency: process.env.AWS_LAMBDA_MAX_CONCURRENCY ?? 'unset',
    // Only the lines this invocation emitted, selected by the request id
    // stamped on them. Under LMI multiplexing this only works because
    // addContext scopes the lambda context per invocation via the
    // InvokeStore (#5430) — an empty logs array here is the signature of
    // that scoping regressing. The invocationKey assertion in the test
    // then verifies appendKeys isolation on independently-selected lines.
    logs: capturedLogs.filter(
      (log) => log.function_request_id === context.awsRequestId
    ),
  };
};

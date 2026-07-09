import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

// Module scope: identifies the execution environment across invocations
const executionEnvId = randomUUID();

// Capture the log lines the Logger emits so they can be returned in the
// response payload: on LMI the Invoke API does not support Tail logs and
// CloudWatch delivery is asynchronous, so returning the logs is the only
// fully deterministic way for the test to read them. In production mode the
// Logger writes each log line as a single atomic write to process.stdout
// (via its own Console instance, bypassing Lambda's patched global console),
// so intercepting the stream captures the real production write path.
const capturedLogs: Array<Record<string, unknown>> = [];
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
  try {
    capturedLogs.push(JSON.parse(chunk.toString()));
  } catch {
    // not a JSON log line, ignore
  }
  // @ts-expect-error - passing through the remaining overloaded args as-is
  return originalWrite(chunk, ...rest);
}) as typeof process.stdout.write;

const logger = new Logger();

// Invocations multiplexed into the same execution environment share this
// module-scoped state, which lets us prove a genuine overlap: every
// invocation blocks until a second invocation is in flight in the same
// environment (or times out reporting that it stayed alone)
let inFlight = 0;
let barrier = Promise.withResolvers<void>();

export const handler = async (
  event: { invocationId: string; role: 'warmup' | 'test' },
  context: Context
) => {
  logger.addContext(context);
  logger.appendKeys({ invocationKey: event.invocationId });

  let sawPeer = false;
  if (event.role === 'test') {
    inFlight++;
    if (inFlight >= 2) {
      barrier.resolve();
    }
    sawPeer = await Promise.race([
      barrier.promise.then(() => true),
      setTimeout(15_000, false),
    ]);
    inFlight--;
    if (inFlight === 0) {
      barrier = Promise.withResolvers<void>();
    }
  }

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

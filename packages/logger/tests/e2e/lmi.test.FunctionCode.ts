import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

// Module scope: identifies the execution environment across invocations
const executionEnvId = randomUUID();
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

  logger.info('LMI isolation test', {
    executionEnvId,
    sawPeer,
    initializationType: process.env.AWS_LAMBDA_INITIALIZATION_TYPE ?? 'unset',
    maxConcurrency: process.env.AWS_LAMBDA_MAX_CONCURRENCY ?? 'unset',
  });
  logger.resetKeys();

  return { invocationId: event.invocationId };
};

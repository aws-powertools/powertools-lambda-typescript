import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { Metrics, MetricUnit } from '../../src/index.js';
import type { EmfOutput } from '../../src/types/index.js';

// Module scope: identifies the execution environment across invocations
const executionEnvId = randomUUID();

// Capture the EMF payloads Metrics emits so they can be returned in the
// response payload: on LMI the Invoke API does not support Tail logs and
// CloudWatch delivery is asynchronous, so returning the payloads is the only
// fully deterministic way for the test to read them. Outside dev mode Metrics
// writes each payload as a single console.log call on its own Console instance
// bound to process.stdout (bypassing Lambda's patched global console), so
// intercepting the stream captures the real production write path.
const capturedPayloads: EmfOutput[] = [];
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
  try {
    const parsed = JSON.parse(chunk.toString());
    if (typeof parsed === 'object' && parsed !== null && '_aws' in parsed) {
      capturedPayloads.push(parsed);
    }
  } catch {
    // not a JSON line, ignore
  }
  // @ts-expect-error - passing through the remaining overloaded args as-is
  return originalWrite(chunk, ...rest);
}) as typeof process.stdout.write;

const metrics = new Metrics({ namespace: process.env.EXPECTED_NAMESPACE });

// Invocations multiplexed into the same execution environment share this
// module-scoped state, which lets us prove a genuine overlap: every
// invocation blocks until a second invocation is in flight in the same
// environment (or times out reporting that it stayed alone)
let inFlight = 0;
let barrier = Promise.withResolvers<void>();

export const handler = async (event: {
  invocationId: string;
  metricValue: number;
  role: 'warmup' | 'test';
}) => {
  // Stored before the barrier so that overlapping invocations hold their
  // metric and metadata in the store at the same time. Dimensions stay at the
  // defaults so that each run adds a single metric to the namespace.
  metrics.addMetadata('invocationKey', event.invocationId);
  metrics.addMetric('LmiIsolation', MetricUnit.Count, event.metricValue);

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

  metrics.publishStoredMetrics();

  return {
    invocationId: event.invocationId,
    executionEnvId,
    sawPeer,
    initializationType: process.env.AWS_LAMBDA_INITIALIZATION_TYPE ?? 'unset',
    maxConcurrency: process.env.AWS_LAMBDA_MAX_CONCURRENCY ?? 'unset',
    // Only the payloads carrying this invocation's metadata key. Under LMI
    // multiplexing this only works because addMetadata scopes metadata per
    // invocation via the InvokeStore — an empty payloads array here is the
    // signature of that scoping regressing. The metric value assertion in the
    // test then verifies addMetric isolation on independently-selected
    // payloads.
    payloads: capturedPayloads.filter(
      (payload) => payload.invocationKey === event.invocationId
    ),
  };
};
